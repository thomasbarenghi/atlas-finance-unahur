import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";
import {
  toUserResponse,
  UserResponseDto,
} from "../users/dto/user-response.dto";
import { User } from "../users/entities/user.entity";
import { AuthResponse, TokenPair } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Session } from "./entities/session.entity";
import { SessionValidationCache } from "./session-validation-cache.service";

const REFRESH_SEPARATOR = ".";

/**
 * Refresh tokens are 256-bit random secrets, not user-chosen passwords: a fast
 * cryptographic hash is enough (argon2 is only needed for low-entropy
 * passwords). Keeping argon2 here made every token rotation cost ~1 s.
 */
const hashRefreshSecret = (secret: string): string =>
  createHash("sha256").update(secret).digest("hex");

/** Accepts the new SHA-256 hashes and legacy argon2 hashes still in the DB. */
const matchesRefreshSecret = async (
  storedHash: string,
  secret: string,
): Promise<boolean> => {
  if (storedHash.startsWith("$argon2")) {
    return argon2.verify(storedHash, secret);
  }
  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(hashRefreshSecret(secret), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly sessionCache: SessionValidationCache,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new ApiException(
        ErrorCode.EMAIL_IN_USE,
        HttpStatus.CONFLICT,
        "Ese email ya está registrado",
      );
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        name: dto.name.trim(),
        email,
        passwordHash,
        primaryCurrency: this.config.get("defaultCurrency", { infer: true }),
      }),
    );

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepository.findOneBy({ email });
    const valid =
      user !== null && (await argon2.verify(user.passwordHash, dto.password));
    if (!user || !valid) {
      throw new ApiException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        "Email o contraseña incorrectos",
      );
    }
    return this.createAuthResponse(user);
  }

  async refresh(refreshToken: string | undefined): Promise<TokenPair> {
    if (!refreshToken) {
      throw new ApiException(
        ErrorCode.SESSION_REVOKED,
        HttpStatus.UNAUTHORIZED,
        "Sesión no válida",
      );
    }
    const [sessionId, secret] = refreshToken.split(REFRESH_SEPARATOR);
    if (!sessionId || !secret) {
      throw new ApiException(
        ErrorCode.SESSION_REVOKED,
        HttpStatus.UNAUTHORIZED,
        "Sesión no válida",
      );
    }

    const session = await this.sessionsRepository.findOneBy({ id: sessionId });
    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new ApiException(
        ErrorCode.SESSION_REVOKED,
        HttpStatus.UNAUTHORIZED,
        "Sesión no válida",
      );
    }

    const valid = await matchesRefreshSecret(session.refreshTokenHash, secret);
    if (!valid) {
      throw new ApiException(
        ErrorCode.SESSION_REVOKED,
        HttpStatus.UNAUTHORIZED,
        "Sesión no válida",
      );
    }

    const user = await this.usersRepository.findOneBy({ id: session.userId });
    if (!user) {
      throw new ApiException(
        ErrorCode.SESSION_REVOKED,
        HttpStatus.UNAUTHORIZED,
        "Sesión no válida",
      );
    }

    // The caller will use the new access token immediately; skip the session
    // lookup in the guard for that first request (and its cache window).
    this.sessionCache.remember(
      session.id,
      { id: user.id, email: user.email, sessionId: session.id },
      session.expiresAt,
    );

    const rotated = this.buildRefreshToken();
    // `save` re-selects the row and wraps the write in an explicit transaction
    // (≈4 extra round-trips). The session already exists and was validated, so
    // a direct UPDATE is enough and keeps rotation cheap over a remote DB.
    await this.sessionsRepository.update(
      { id: session.id },
      { refreshTokenHash: rotated.hash },
    );

    return {
      accessToken: this.signAccessToken(user, session.id),
      refreshToken: `${session.id}${REFRESH_SEPARATOR}${rotated.secret}`,
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.sessionsRepository.update(
      { id: sessionId, userId },
      { revokedAt: new Date() },
    );
    // Drop the cached validation so the revoked token stops working
    // immediately on this instance instead of waiting for the TTL.
    this.sessionCache.delete(sessionId);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El usuario no existe",
      );
    }
    return toUserResponse(user);
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const session = await this.createSession(user.id);
    this.sessionCache.remember(
      session.id,
      { id: user.id, email: user.email, sessionId: session.id },
      session.expiresAt,
    );
    return {
      user: toUserResponse(user),
      accessToken: this.signAccessToken(user, session.id),
      refreshToken: `${session.id}${REFRESH_SEPARATOR}${session.secret}`,
    };
  }

  private async createSession(userId: string): Promise<{
    id: string;
    secret: string;
    expiresAt: Date;
  }> {
    const id = randomUUID();
    const refresh = this.buildRefreshToken();
    const refreshTtlDays = this.config.get("jwt", {
      infer: true,
    }).refreshTtlDays;
    const expiresAt = new Date(Date.now() + refreshTtlDays * 86_400_000);
    await this.sessionsRepository.save(
      this.sessionsRepository.create({
        id,
        userId,
        refreshTokenHash: refresh.hash,
        expiresAt,
      }),
    );
    return { id, secret: refresh.secret, expiresAt };
  }

  private buildRefreshToken(): { secret: string; hash: string } {
    const secret = randomBytes(32).toString("hex");
    return { secret, hash: hashRefreshSecret(secret) };
  }

  private signAccessToken(user: User, sessionId: string): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });
  }
}

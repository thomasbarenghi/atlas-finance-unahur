import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { randomBytes, randomUUID } from "crypto";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";
import { MailService } from "../shared/mail/mail.service";
import {
  toUserResponse,
  UserResponseDto,
} from "../users/dto/user-response.dto";
import { User } from "../users/entities/user.entity";
import { AuthResponse, TokenPair } from "./dto/auth-response.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Session } from "./entities/session.entity";

interface ResetTokenPayload {
  sub: string;
  purpose: "reset";
}

const REFRESH_SEPARATOR = ".";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly mailService: MailService,
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
        baseCurrency: "ARS",
        theme: "system",
        aiEnabled: false,
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

    const valid = await argon2.verify(session.refreshTokenHash, secret);
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

    const rotated = await this.buildRefreshToken();
    session.refreshTokenHash = rotated.hash;
    await this.sessionsRepository.save(session);

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

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) return;

    const token = await this.jwtService.signAsync(
      { sub: user.id, purpose: "reset" } satisfies ResetTokenPayload,
      { expiresIn: this.config.get("resetTokenTtl", { infer: true }) },
    );
    await this.mailService.sendPasswordReset(user.email, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let payload: ResetTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<ResetTokenPayload>(dto.token);
    } catch {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El enlace de recuperación es inválido o expiró",
      );
    }
    if (payload.purpose !== "reset" || !payload.sub) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El enlace de recuperación es inválido o expiró",
      );
    }

    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El enlace de recuperación es inválido o expiró",
      );
    }

    user.passwordHash = await argon2.hash(dto.password);
    await this.usersRepository.save(user);
    await this.sessionsRepository.update(
      { userId: user.id },
      { revokedAt: new Date() },
    );
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const session = await this.createSession(user.id);
    return {
      user: toUserResponse(user),
      accessToken: this.signAccessToken(user, session.id),
      refreshToken: `${session.id}${REFRESH_SEPARATOR}${session.secret}`,
    };
  }

  private async createSession(userId: string): Promise<{
    id: string;
    secret: string;
  }> {
    const id = randomUUID();
    const refresh = await this.buildRefreshToken();
    const refreshTtlDays = this.config.get("jwt", {
      infer: true,
    }).refreshTtlDays;
    await this.sessionsRepository.save(
      this.sessionsRepository.create({
        id,
        userId,
        refreshTokenHash: refresh.hash,
        expiresAt: new Date(Date.now() + refreshTtlDays * 86_400_000),
      }),
    );
    return { id, secret: refresh.secret };
  }

  private async buildRefreshToken(): Promise<{
    secret: string;
    hash: string;
  }> {
    const secret = randomBytes(32).toString("hex");
    return { secret, hash: await argon2.hash(secret) };
  }

  private signAccessToken(user: User, sessionId: string): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });
  }
}

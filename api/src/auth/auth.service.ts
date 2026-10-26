import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { JwtPayload } from "../common/types/auth-user";
import { AppConfig } from "../config/configuration";
import {
  toUserResponse,
  UserResponseDto,
} from "../users/dto/user-response.dto";
import { User } from "../users/entities/user.entity";
import { AuthResult, TokenPair } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const SECONDS_PER_DAY = 86_400;

const invalidSession = (): ApiException =>
  new ApiException(
    ErrorCode.SESSION_REVOKED,
    HttpStatus.UNAUTHORIZED,
    "Sesión no válida",
  );

/**
 * Stateless JWT authentication. Access and refresh tokens are self-contained
 * and signed with the same secret; a `type` claim prevents using one as the
 * other. There is no session table and no server-side revocation: logout only
 * clears the cookies, so an already-issued token remains valid until it expires.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
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

    return this.createAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
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
    return this.createAuthResult(user);
  }

  async refresh(refreshToken: string | undefined): Promise<TokenPair> {
    if (!refreshToken) throw invalidSession();

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw invalidSession();
    }
    if (payload.type !== "refresh") throw invalidSession();

    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user) throw invalidSession();

    return this.issueTokens(user);
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

  private createAuthResult(user: User): AuthResult {
    return {
      user: toUserResponse(user),
      tokens: this.issueTokens(user),
    };
  }

  private issueTokens(user: User): TokenPair {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      type: "access",
    });
  }

  private signRefreshToken(user: User): string {
    const refreshTtlDays = this.config.get("jwt", {
      infer: true,
    }).refreshTtlDays;
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: "refresh",
      },
      { expiresIn: refreshTtlDays * SECONDS_PER_DAY },
    );
  }
}

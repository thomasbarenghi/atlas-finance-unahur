import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthUser } from "../common/types/auth-user";
import { AppConfig } from "../config/configuration";
import { UserResponseDto } from "../users/dto/user-response.dto";
import { AuthService } from "./auth.service";
import {
  AuthResponse,
  RegisterResponse,
  TokenPair,
} from "./dto/auth-response.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  @ApiOperation({ summary: "Registra un usuario y abre sesión" })
  @ApiErrors(400, 409)
  @ApiOkResponse({ type: AuthResponse })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RegisterResponse> {
    const result = await this.authService.register(dto);
    if (!("pendingApproval" in result)) {
      this.setAuthCookies(response, result);
    }
    return result;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "Inicia sesión" })
  @ApiErrors(400, 401)
  @ApiOkResponse({ type: AuthResponse })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(response, result);
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  @ApiOperation({ summary: "Rota el refresh token" })
  @ApiErrors(400, 401)
  @ApiOkResponse({ type: TokenPair })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenPair> {
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = dto.refreshToken ?? cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(token);
    this.setTokenCookies(response, tokens);
    return tokens;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cierra la sesión activa" })
  @ApiErrors(401)
  @ApiNoContentResponse({ description: "Sesión cerrada" })
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id, user.sessionId);
    this.clearAuthCookies(response);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Devuelve el usuario autenticado" })
  @ApiErrors(401)
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser("id") userId: string): Promise<UserResponseDto> {
    return this.authService.getMe(userId);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("forgot-password")
  @ApiOperation({ summary: "Solicita recuperación de contraseña" })
  @ApiErrors(400)
  @ApiNoContentResponse({
    description: "Solicitud registrada (no revela si el email existe)",
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("reset-password")
  @ApiOperation({ summary: "Restablece la contraseña con un token" })
  @ApiErrors(400)
  @ApiNoContentResponse({ description: "Contraseña restablecida" })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }

  private setAuthCookies(response: Response, auth: AuthResponse): void {
    const tokens: TokenPair = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    };
    this.setTokenCookies(response, tokens);
  }

  private setTokenCookies(response: Response, tokens: TokenPair): void {
    const cookie = this.config.get("cookie", { infer: true });
    const jwt = this.config.get("jwt", { infer: true });
    const base = {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: "/",
    };
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...base,
      maxAge: jwt.accessTtl * 1000,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...base,
      maxAge: jwt.refreshTtlDays * 86_400_000,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, { path: "/" });
    response.clearCookie(REFRESH_COOKIE, { path: "/" });
  }
}

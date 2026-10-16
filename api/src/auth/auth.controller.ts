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
import { Request, Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthUser } from "../common/types/auth-user";
import { AppConfig } from "../config/configuration";
import { UserResponseDto } from "../users/dto/user-response.dto";
import { AuthService } from "./auth.service";
import { AuthResponse, TokenPair } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(response, result);
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
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
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id, user.sessionId);
    this.clearAuthCookies(response);
  }

  @Get("me")
  me(@CurrentUser("id") userId: string): Promise<UserResponseDto> {
    return this.authService.getMe(userId);
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

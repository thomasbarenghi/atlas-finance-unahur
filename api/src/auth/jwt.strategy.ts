import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { AuthUser, JwtPayload } from "../common/types/auth-user";
import { AppConfig } from "../config/configuration";
import { Session } from "./entities/session.entity";
import { SessionValidationCache } from "./session-validation-cache.service";

const cookieExtractor = (request: Request): string | null => {
  const cookies = request.cookies as Record<string, string> | undefined;
  return cookies?.access_token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppConfig, true>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly sessionCache: SessionValidationCache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get("jwt", { infer: true }).accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return this.sessionCache.getOrValidate(payload.sid, async () => {
      const session = await this.sessionsRepository.findOneBy({
        id: payload.sid,
        userId: payload.sub,
      });
      if (
        !session ||
        session.revokedAt !== null ||
        session.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException();
      }
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          sessionId: payload.sid,
        },
        expiresAt: session.expiresAt,
      };
    });
  }
}

import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";
import { Request } from "express";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";

const ADMIN_KEY_HEADER = "x-admin-key";

const matchesKey = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

/**
 * Authorizes the admin endpoints with a shared secret read from the API `.env`
 * (`ADMIN_API_KEY`, header `x-admin-key`). When the key is not configured the
 * endpoints are disabled (404) so the surface stays closed by default.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get("approval", { infer: true }).adminApiKey;
    if (!expected) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "No disponible",
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(ADMIN_KEY_HEADER) ?? "";
    if (!provided || !matchesKey(provided, expected)) {
      throw new ApiException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        "Clave de administrador inválida",
      );
    }
    return true;
  }
}

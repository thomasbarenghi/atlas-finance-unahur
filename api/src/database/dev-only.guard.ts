import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";

/**
 * Fail-closed gate for the destructive development endpoints. It answers `404`
 * for anything that is not an explicitly configured development/test
 * environment, so the routes are indistinguishable from missing routes in
 * production (including when `NODE_ENV` is unset). An optional
 * `DEV_DATABASE_TOKEN` adds a shared-secret check on top.
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const dev = this.config.get("dev", { infer: true });
    if (!dev.databaseResetEnabled) {
      throw new NotFoundException();
    }

    const expectedToken = dev.databaseToken;
    if (expectedToken) {
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, string | string[] | undefined>;
      }>();
      const provided = request.headers["x-dev-database-token"];
      if (provided !== expectedToken) {
        throw new NotFoundException();
      }
    }

    return true;
  }
}

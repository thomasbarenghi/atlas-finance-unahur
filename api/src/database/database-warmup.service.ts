import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { AppConfig } from "../config/configuration";

/**
 * Opens the pool connections during startup instead of on the first burst of
 * traffic. Against a remote database each new connection pays a TLS handshake
 * (~1–2 s); warming them here keeps the first dashboard request fast.
 *
 * Combined with `min = max`, connections stay open for the process lifetime,
 * so the dashboard page (several parallel queries) does not reopen them on
 * every visit.
 */
@Injectable()
export class DatabaseWarmupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseWarmupService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const { poolMax } = this.config.get("database", { infer: true });
    try {
      await Promise.all(
        Array.from({ length: poolMax }, () =>
          this.dataSource.query("SELECT 1"),
        ),
      );
    } catch (error) {
      // A failed warm-up must not prevent the app from starting; the pool will
      // open connections on demand and `connectionTimeoutMillis` still applies.
      this.logger.warn(
        `No se pudo precalentar el pool: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

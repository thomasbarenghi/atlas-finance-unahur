import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { DataSourceOptions } from "typeorm";
import { AppConfig } from "../config/configuration";
import { DatabaseWarmupService } from "./database-warmup.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
      ): DataSourceOptions => {
        const database = config.get("database", { infer: true });
        return {
          type: "postgres",
          url: database.url,
          ssl: database.ssl ? { rejectUnauthorized: false } : false,
          entities: [join(__dirname, "..", "**", "*.entity.{ts,js}")],
          // No migrations by design: the schema is derived from the entities and
          // rebuilt from scratch when the model changes (see docs/backend.md §11).
          synchronize: true,
          // Keep the per-instance pool small so a serverless deployment (Vercel)
          // never exhausts the Supabase pooler ("max clients reached"). Requests
          // wait for a free connection instead of failing immediately.
          extra: {
            max: database.poolMax,
            // Keep the whole pool warm. Supabase is reached over the public
            // network, so each new connection pays a TLS handshake (~1–2 s);
            // closing idle connections after 10 s made the first dashboard
            // request after a pause take seconds. `DatabaseWarmupService`
            // opens them at startup and `min = max` keeps them open. Lower
            // `min` in serverless if the provider limits idle connections;
            // `idleTimeoutMillis` then controls the connections above `min`.
            min: database.poolMax,
            connectionTimeoutMillis: database.connectionTimeoutMs,
            idleTimeoutMillis: database.idleTimeoutMs,
            keepAlive: true,
          },
        };
      },
    }),
  ],
  providers: [DatabaseWarmupService],
})
export class DatabaseModule {}

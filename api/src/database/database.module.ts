import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { DataSourceOptions } from "typeorm";
import { AppConfig } from "../config/configuration";
import { DatabaseMaintenanceService } from "./database-maintenance.service";
import { DevDatabaseController } from "./dev-database.controller";

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
        };
      },
    }),
  ],
  controllers: [DevDatabaseController],
  providers: [DatabaseMaintenanceService],
  exports: [DatabaseMaintenanceService],
})
export class DatabaseModule {}

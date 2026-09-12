import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { DataSourceOptions } from "typeorm";
import { AppConfig } from "../config/configuration";

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
          migrations: [join(__dirname, "migrations", "*.{ts,js}")],
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}

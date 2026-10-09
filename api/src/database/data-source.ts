import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { join } from "path";
import { DataSource } from "typeorm";

loadEnv();

const sslEnabled = process.env.DB_SSL === "true";

/**
 * Standalone DataSource for the `seed`/`db:*` scripts. The schema is always
 * derived from the entities (`synchronize`), never from migrations.
 */
const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, "..", "**", "*.entity.{ts,js}")],
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
});

export default AppDataSource;

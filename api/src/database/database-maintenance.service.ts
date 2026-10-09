import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { runSeed } from "./seeds/seed";

export type DatabaseAction = "clear" | "seed" | "reset";

export interface DatabaseActionSummary {
  action: DatabaseAction;
  /** Number of application tables involved in the operation. */
  tables: number;
  /** Whether the demo seed ran as part of the operation. */
  seeded: boolean;
}

/**
 * Development/test database maintenance. It deliberately favours "drop and
 * rebuild" over migrations: this project has no migration infrastructure (see
 * `docs/architecture/backend.md` §11), so schema changes are handled by
 * `synchronize` and stale data is discarded.
 */
@Injectable()
export class DatabaseMaintenanceService {
  private readonly logger = new Logger(DatabaseMaintenanceService.name);

  constructor(private readonly dataSource: DataSource) {}

  /** Tables currently owned by the TypeORM entities. */
  getApplicationTables(): string[] {
    return this.dataSource.entityMetadatas
      .map((metadata) => metadata.tableName)
      .sort();
  }

  /**
   * Empties every application table in a single statement. `CASCADE` resolves
   * the foreign-key graph for us and `RESTART IDENTITY` keeps generated
   * identifiers predictable between resets.
   */
  async clearAllData(): Promise<number> {
    const tables = this.getApplicationTables();
    if (tables.length > 0) {
      const list = tables.map((table) => `"${table}"`).join(", ");
      await this.dataSource.query(
        `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
      );
    }
    await this.dropLegacyTables();
    this.logger.log(`Cleared ${tables.length} application tables`);
    return tables.length;
  }

  /**
   * Drops and recreates the schema from the current entities. This is the
   * equivalent of the `synchronize: true` bootstrap, forced to run even when
   * the shape of money data would make an in-place update impossible.
   */
  async recreateSchema(): Promise<number> {
    await this.dataSource.synchronize(true);
    await this.dropLegacyTables();
    const tables = this.getApplicationTables();
    this.logger.log(`Recreated ${tables.length} application tables`);
    return tables.length;
  }

  async seed(): Promise<void> {
    await runSeed(this.dataSource);
  }

  async clear(): Promise<DatabaseActionSummary> {
    const tables = await this.clearAllData();
    return { action: "clear", tables, seeded: false };
  }

  async reset(): Promise<DatabaseActionSummary> {
    const tables = await this.recreateSchema();
    await this.seed();
    return { action: "reset", tables, seeded: true };
  }

  /**
   * The former migration bookkeeping table is no longer part of the model;
   * dropping it here keeps an old checkout from leaving dead tables behind.
   */
  private async dropLegacyTables(): Promise<void> {
    await this.dataSource.query(`DROP TABLE IF EXISTS "migrations"`);
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { runSeed } from "./seeds/seed";

/**
 * Database maintenance behind the `db:clear` and `db:reset` scripts. This
 * project has no migration infrastructure (see `docs/architecture/backend.md`
 * §11), so schema changes are handled by `synchronize` and stale data is
 * discarded.
 */
@Injectable()
export class DatabaseMaintenanceService {
  private readonly logger = new Logger(DatabaseMaintenanceService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Empties every application table in a single statement. `CASCADE` resolves
   * the foreign-key graph and `RESTART IDENTITY` keeps generated identifiers
   * predictable between resets.
   */
  async clear(): Promise<number> {
    const tables = this.getApplicationTables();
    if (tables.length > 0) {
      const list = tables.map((table) => `"${table}"`).join(", ");
      await this.dataSource.query(
        `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
      );
    }
    this.logger.log(`Cleared ${tables.length} application tables`);
    return tables.length;
  }

  /** Recreates the schema from the entities and runs the demo seed. */
  async reset(): Promise<number> {
    await this.dataSource.synchronize(true);
    const tables = this.getApplicationTables();
    await runSeed(this.dataSource);
    this.logger.log(`Recreated ${tables.length} application tables`);
    return tables.length;
  }

  private getApplicationTables(): string[] {
    return this.dataSource.entityMetadatas
      .map((metadata) => metadata.tableName)
      .sort();
  }
}

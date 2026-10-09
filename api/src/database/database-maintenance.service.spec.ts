import { DataSource } from "typeorm";
import { DatabaseMaintenanceService } from "./database-maintenance.service";
import { runSeed } from "./seeds/seed";

jest.mock("./seeds/seed", () => ({ runSeed: jest.fn() }));

const runSeedMock = runSeed as jest.Mock;

interface MockDataSource {
  entityMetadatas: Array<{ tableName: string }>;
  query: jest.Mock;
  synchronize: jest.Mock;
}

const buildDataSource = (): MockDataSource => ({
  entityMetadatas: [
    { tableName: "users" },
    { tableName: "transactions" },
    { tableName: "accounts" },
  ],
  query: jest.fn().mockResolvedValue(undefined),
  synchronize: jest.fn().mockResolvedValue(undefined),
});

describe("DatabaseMaintenanceService", () => {
  let dataSource: MockDataSource;
  let service: DatabaseMaintenanceService;

  beforeEach(() => {
    dataSource = buildDataSource();
    service = new DatabaseMaintenanceService(
      dataSource as unknown as DataSource,
    );
    runSeedMock.mockReset();
    runSeedMock.mockResolvedValue(undefined);
  });

  it("lists the application tables sorted", () => {
    expect(service.getApplicationTables()).toEqual([
      "accounts",
      "transactions",
      "users",
    ]);
  });

  it("truncates every application table and drops the legacy migrations table", async () => {
    const tables = await service.clearAllData();

    expect(tables).toBe(3);
    expect(dataSource.query).toHaveBeenCalledWith(
      'TRUNCATE TABLE "accounts", "transactions", "users" RESTART IDENTITY CASCADE',
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      'DROP TABLE IF EXISTS "migrations"',
    );
  });

  it("returns a clear summary without seeding", async () => {
    const summary = await service.clear();
    expect(summary).toEqual({ action: "clear", tables: 3, seeded: false });
    expect(runSeedMock).not.toHaveBeenCalled();
  });

  it("recreates the schema from the entities", async () => {
    const tables = await service.recreateSchema();
    expect(dataSource.synchronize).toHaveBeenCalledWith(true);
    expect(tables).toBe(3);
  });

  it("resets the schema and runs the seed", async () => {
    const summary = await service.reset();
    expect(dataSource.synchronize).toHaveBeenCalledWith(true);
    expect(runSeedMock).toHaveBeenCalledWith(dataSource);
    expect(summary).toEqual({ action: "reset", tables: 3, seeded: true });
  });

  it("delegates seeding to runSeed", async () => {
    await service.seed();
    expect(runSeedMock).toHaveBeenCalledWith(dataSource);
  });
});

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

  it("truncates every application table", async () => {
    const tables = await service.clear();

    expect(tables).toBe(3);
    expect(dataSource.query).toHaveBeenCalledWith(
      'TRUNCATE TABLE "accounts", "transactions", "users" RESTART IDENTITY CASCADE',
    );
    expect(runSeedMock).not.toHaveBeenCalled();
  });

  it("skips the query when there are no application tables", async () => {
    dataSource.entityMetadatas = [];

    await expect(service.clear()).resolves.toBe(0);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it("recreates the schema and runs the seed", async () => {
    const tables = await service.reset();

    expect(tables).toBe(3);
    expect(dataSource.synchronize).toHaveBeenCalledWith(true);
    expect(runSeedMock).toHaveBeenCalledWith(dataSource);
  });
});

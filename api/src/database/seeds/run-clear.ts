import { Logger } from "@nestjs/common";
import AppDataSource from "../data-source";
import { DatabaseMaintenanceService } from "../database-maintenance.service";

const logger = new Logger("RunClear");

const main = async (): Promise<void> => {
  await AppDataSource.initialize();
  try {
    const maintenance = new DatabaseMaintenanceService(AppDataSource);
    const summary = await maintenance.clear();
    logger.log(`Cleared ${summary.tables} application tables`);
  } finally {
    await AppDataSource.destroy();
  }
};

void main()
  .then(() => logger.log("Clear finished"))
  .catch((error: unknown) => {
    logger.error(
      "Clear failed",
      error instanceof Error ? error.stack : undefined,
    );
    process.exitCode = 1;
  });

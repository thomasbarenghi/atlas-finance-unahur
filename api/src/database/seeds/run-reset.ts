import { Logger } from "@nestjs/common";
import AppDataSource from "../data-source";
import { DatabaseMaintenanceService } from "../database-maintenance.service";

const logger = new Logger("RunReset");

const main = async (): Promise<void> => {
  await AppDataSource.initialize();
  try {
    const maintenance = new DatabaseMaintenanceService(AppDataSource);
    const summary = await maintenance.reset();
    logger.log(`Schema recreated (${summary.tables} tables) and seed executed`);
  } finally {
    await AppDataSource.destroy();
  }
};

void main()
  .then(() => logger.log("Reset finished"))
  .catch((error: unknown) => {
    logger.error(
      "Reset failed",
      error instanceof Error ? error.stack : undefined,
    );
    process.exitCode = 1;
  });

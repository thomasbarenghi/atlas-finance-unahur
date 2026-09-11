import { Logger } from "@nestjs/common";
import AppDataSource from "../data-source";
import { runSeed } from "./seed";

const logger = new Logger("RunSeed");

const main = async (): Promise<void> => {
  await AppDataSource.initialize();
  try {
    await runSeed(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
};

void main()
  .then(() => logger.log("Seed finished"))
  .catch((error: unknown) => {
    logger.error(
      "Seed failed",
      error instanceof Error ? error.stack : undefined,
    );
    process.exitCode = 1;
  });

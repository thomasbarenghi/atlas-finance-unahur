import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import {
  DatabaseActionSummary,
  DatabaseMaintenanceService,
} from "./database-maintenance.service";
import { DevOnlyGuard } from "./dev-only.guard";

/**
 * Destructive maintenance routes for local development and tests only. They are
 * hidden from the public OpenAPI document and gated by `DevOnlyGuard`, which
 * returns `404` outside development/test.
 */
@ApiExcludeController()
@Public()
@UseGuards(DevOnlyGuard)
@Controller("dev/database")
export class DevDatabaseController {
  constructor(private readonly maintenance: DatabaseMaintenanceService) {}

  @Post("clear")
  @HttpCode(HttpStatus.OK)
  clear(): Promise<DatabaseActionSummary> {
    return this.maintenance.clear();
  }

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  async seed(): Promise<DatabaseActionSummary> {
    await this.maintenance.seed();
    return {
      action: "seed",
      tables: this.maintenance.getApplicationTables().length,
      seeded: true,
    };
  }

  @Post("reset")
  @HttpCode(HttpStatus.OK)
  reset(): Promise<DatabaseActionSummary> {
    return this.maintenance.reset();
  }
}

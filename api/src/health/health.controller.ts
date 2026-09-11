import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { Public } from "../common/decorators/public.decorator";

export interface HealthResponse {
  status: "ok" | "degraded";
  db: "up" | "down";
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liveness and database connectivity check" })
  @ApiOkResponse({ description: "{ status: 'ok', db: 'up' }" })
  async check(): Promise<HealthResponse> {
    try {
      await this.dataSource.query("SELECT 1");
      return { status: "ok", db: "up" };
    } catch {
      return { status: "degraded", db: "down" };
    }
  }
}

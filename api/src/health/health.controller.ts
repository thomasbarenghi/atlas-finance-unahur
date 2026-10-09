import { Controller, Get } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { Public } from "../common/decorators/public.decorator";

export class HealthResponse {
  @ApiProperty({ enum: ["ok", "degraded"], example: "ok" })
  status: "ok" | "degraded";

  @ApiProperty({ enum: ["up", "down"], example: "up" })
  db: "up" | "down";
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Liveness and database connectivity check" })
  @ApiOkResponse({ type: HealthResponse })
  async check(): Promise<HealthResponse> {
    try {
      await this.dataSource.query("SELECT 1");
      return { status: "ok", db: "up" };
    } catch {
      return { status: "degraded", db: "down" };
    }
  }
}

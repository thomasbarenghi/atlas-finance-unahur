import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Public } from "../common/decorators/public.decorator";

export class HealthResponse {
  status: "ok" | "degraded";
  db: "up" | "down";
}

@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.dataSource.query("SELECT 1");
      return { status: "ok", db: "up" };
    } catch {
      return { status: "degraded", db: "down" };
    }
  }
}

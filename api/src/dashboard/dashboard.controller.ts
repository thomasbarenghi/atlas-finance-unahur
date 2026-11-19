import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DashboardOrchestrator } from "./dashboard.orchestrator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData } from "./dto/dashboard-response.dto";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardOrchestrator: DashboardOrchestrator) {}

  @Get()
  get(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardData> {
    return this.dashboardOrchestrator.getDashboard(userId, query);
  }
}

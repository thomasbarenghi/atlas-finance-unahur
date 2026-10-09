import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DashboardOrchestrator } from "./dashboard.orchestrator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData } from "./dto/dashboard-response.dto";

@ApiTags("dashboard")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardOrchestrator: DashboardOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Resumen financiero agregado del período" })
  @ApiOkResponse({ description: "DashboardData" })
  get(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardData> {
    return this.dashboardOrchestrator.getDashboard(userId, query);
  }
}

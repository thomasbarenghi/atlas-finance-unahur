import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DashboardOrchestrator } from "./dashboard.orchestrator";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData } from "./dto/dashboard-response.dto";

@ApiTags("dashboard")
@ApiBearerAuth()
@ApiErrors(400, 401)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardOrchestrator: DashboardOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Resumen financiero agregado del período" })
  @ApiOkResponse({ type: DashboardData })
  get(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardData> {
    return this.dashboardOrchestrator.getDashboard(userId, query);
  }
}

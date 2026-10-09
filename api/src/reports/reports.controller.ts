import { Controller, Get, Query, Res } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DashboardQueryDto } from "../dashboard/dto/dashboard-query.dto";
import { DashboardInvestments } from "../dashboard/dto/dashboard-response.dto";
import {
  BudgetReportRow,
  NetWorthPoint,
  ReportByCategoryRow,
  ReportSummary,
} from "./dto/reports-response.dto";
import { BudgetReportQueryDto, ExportQueryDto } from "./dto/reports-query.dto";
import { ReportsOrchestrator } from "./reports.orchestrator";

@ApiTags("reports")
@ApiBearerAuth()
@ApiErrors(400, 401)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsOrchestrator: ReportsOrchestrator) {}

  @Get("summary")
  @ApiOperation({ summary: "Resumen financiero del período" })
  @ApiOkResponse({ type: ReportSummary })
  summary(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<ReportSummary> {
    return this.reportsOrchestrator.summary(userId, query);
  }

  @Get("by-category")
  @ApiOperation({ summary: "Desglose de ingresos y gastos por categoría" })
  @ApiOkResponse({ type: [ReportByCategoryRow] })
  byCategory(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<ReportByCategoryRow[]> {
    return this.reportsOrchestrator.byCategory(userId, query);
  }

  @Get("net-worth")
  @ApiOperation({ summary: "Evolución del patrimonio neto" })
  @ApiOkResponse({ type: [NetWorthPoint] })
  netWorth(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<NetWorthPoint[]> {
    return this.reportsOrchestrator.netWorth(userId, query);
  }

  @Get("budgets")
  @ApiOperation({ summary: "Cumplimiento de presupuestos del período" })
  @ApiOkResponse({ type: [BudgetReportRow] })
  budgets(
    @CurrentUser("id") userId: string,
    @Query() query: BudgetReportQueryDto,
  ): Promise<BudgetReportRow[]> {
    return this.reportsOrchestrator.budgets(userId, query.period);
  }

  @Get("investments")
  @ApiOperation({ summary: "Rendimiento nominal de inversiones" })
  @ApiOkResponse({ type: DashboardInvestments })
  investments(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardInvestments> {
    return this.reportsOrchestrator.investments(userId, query);
  }

  @Get("export")
  @ApiOperation({ summary: "Exporta movimientos o resumen en CSV" })
  @ApiOkResponse({
    description: "Archivo CSV",
    content: { "text/csv": { schema: { type: "string" } } },
  })
  async export(
    @CurrentUser("id") userId: string,
    @Query() query: ExportQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const csv = await this.reportsOrchestrator.exportCsv(
      userId,
      query,
      query.type ?? "transactions",
    );
    const suffix =
      query.from && query.to ? `${query.from}-${query.to}` : "export";
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="atlass-fin-${suffix}.csv"`,
    );
    return csv;
  }
}

import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { DashboardQueryDto } from "../dashboard/dto/dashboard-query.dto";
import { DashboardData } from "../dashboard/dto/dashboard-response.dto";
import { BudgetReportQueryDto, ExportQueryDto } from "./dto/reports-query.dto";
import {
  BudgetReportRow,
  NetWorthPoint,
  ReportByCategoryRow,
  ReportsOrchestrator,
  ReportSummary,
} from "./reports.orchestrator";

@ApiTags("reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsOrchestrator: ReportsOrchestrator) {}

  @Get("summary")
  @ApiOperation({ summary: "Resumen financiero del período" })
  @ApiOkResponse({ description: "ReportSummary" })
  summary(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<ReportSummary> {
    return this.reportsOrchestrator.summary(userId, query);
  }

  @Get("by-category")
  @ApiOperation({ summary: "Desglose de ingresos y gastos por categoría" })
  @ApiOkResponse({ description: "ReportByCategoryRow[]" })
  byCategory(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<ReportByCategoryRow[]> {
    return this.reportsOrchestrator.byCategory(userId, query);
  }

  @Get("net-worth")
  @ApiOperation({ summary: "Evolución del patrimonio neto" })
  @ApiOkResponse({ description: "NetWorthPoint[]" })
  netWorth(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<NetWorthPoint[]> {
    return this.reportsOrchestrator.netWorth(userId, query);
  }

  @Get("budgets")
  @ApiOperation({ summary: "Cumplimiento de presupuestos del período" })
  @ApiOkResponse({ description: "BudgetReportRow[]" })
  budgets(
    @CurrentUser("id") userId: string,
    @Query() query: BudgetReportQueryDto,
  ): Promise<BudgetReportRow[]> {
    return this.reportsOrchestrator.budgets(userId, query.period);
  }

  @Get("investments")
  @ApiOperation({ summary: "Rendimiento nominal de inversiones" })
  @ApiOkResponse({ description: "DashboardData['investments']" })
  investments(
    @CurrentUser("id") userId: string,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardData["investments"]> {
    return this.reportsOrchestrator.investments(userId, query);
  }

  @Get("export")
  @ApiOperation({ summary: "Exporta movimientos o resumen en CSV" })
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

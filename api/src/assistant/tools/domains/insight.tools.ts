import { Injectable } from "@nestjs/common";
import { DashboardQueryDto } from "../../../dashboard/dto/dashboard-query.dto";
import { DashboardService } from "../../../dashboard/dashboard.service";
import { QuotesService } from "../../../quotes/quotes.service";
import { ReportsService } from "../../../reports/reports.service";
import { jsonSchema, optionalString, validateToolArgs } from "../tool-input";
import type { ToolDefinition, ToolHandlerResult } from "../tool.types";

@Injectable()
export class InsightTools {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly reports: ReportsService,
    private readonly quotes: QuotesService,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "getDashboard",
        title: "Ver panel financiero",
        description:
          "Devuelve KPIs y series del período (patrimonio neto, ingresos, gastos, ahorro, activos, deudas, cuentas e inversiones), gastos por categoría, evolución mensual y alertas de presupuesto. Usala para preguntas analíticas sobre un período.",
        classification: "read",
        parameters: jsonSchema(this.periodSchema()),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const query = await this.buildQuery(args);
          const data = await this.dashboard.getDashboard(userId, query);
          return {
            ok: true,
            summary: `Panel ${data.period.from} a ${data.period.to} en ${data.currency}.`,
            data: {
              period: data.period,
              currency: data.currency,
              kpis: data.kpis,
              expensesByCategory: data.expensesByCategory,
              incomeExpenseByMonth: data.incomeExpenseByMonth,
              netWorthSeries: data.netWorthSeries,
              investments: data.investments,
              budgetAlerts: data.budgetAlerts,
            },
          };
        },
      },
      {
        name: "getReportSummary",
        title: "Resumen del período",
        description:
          "Devuelve ingresos, gastos, ahorro y patrimonio neto del período indicado. Más liviana que getDashboard.",
        classification: "read",
        parameters: jsonSchema(this.periodSchema()),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const query = await this.buildQuery(args);
          const summary = await this.reports.summary(userId, query);
          return {
            ok: true,
            summary: `Resumen ${summary.from} a ${summary.to}.`,
            data: summary,
          };
        },
      },
      {
        name: "getReportByCategory",
        title: "Reporte por categoría",
        description:
          "Devuelve el total y el porcentaje por categoría (ingresos y gastos) del período indicado. Usala para '¿en qué gasté más?', 'gastos por categoría'.",
        classification: "read",
        parameters: jsonSchema(this.periodSchema()),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const query = await this.buildQuery(args);
          const rows = await this.reports.byCategory(userId, query);
          return {
            ok: true,
            summary: `${rows.length} categoría(s) con movimientos en el período.`,
            data: { categories: rows },
          };
        },
      },
      {
        name: "listQuotes",
        title: "Listar cotizaciones",
        description:
          "Lista las cotizaciones de mercado disponibles (símbolo, precio, moneda, proveedor, variación 24h y antigüedad).",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (): Promise<ToolHandlerResult> => {
          const quotes = await this.quotes.listQuotes();
          return {
            ok: true,
            summary: `${quotes.length} cotización(es).`,
            data: { quotes },
          };
        },
      },
    ];
  }

  private periodSchema(): Record<string, unknown> {
    return {
      from: { type: "string", description: "Desde YYYY-MM-DD." },
      to: { type: "string", description: "Hasta YYYY-MM-DD." },
      currency: {
        type: "string",
        description: "Moneda de visualización (opcional; usa la base).",
      },
    };
  }

  private buildQuery(
    args: Record<string, unknown>,
  ): Promise<DashboardQueryDto> {
    return validateToolArgs(DashboardQueryDto, {
      from: optionalString(args.from),
      to: optionalString(args.to),
      currency: optionalString(args.currency),
    });
  }
}

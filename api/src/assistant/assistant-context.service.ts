import { HttpStatus, Injectable } from "@nestjs/common";
import { BudgetsOrchestrator } from "../budgets/budgets.orchestrator";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { DashboardOrchestrator } from "../dashboard/dashboard.orchestrator";
import { UsersService } from "../users/users.service";
import { AssistantMessageDto } from "./dto/assistant-message.dto";

export interface AssistantContext {
  period: { from: string; to: string };
  currency: string;
  sources: string[];
  summary: string;
}

const DAY_MS = 86_400_000;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Builds the minimal, pre-calculated context sent to the LLM (FR-IA-002/003/005,
 * RN-013). It reuses the dashboard read model (the single source of truth for
 * CAL-001/CAL-002 aggregation and FX conversion) instead of re-deriving
 * formulas, so the figures it hands the model match the dashboard and reports
 * (AGENTS rule 7: never duplicate a calculation).
 */
@Injectable()
export class AssistantContextService {
  constructor(
    private readonly usersService: UsersService,
    private readonly dashboardOrchestrator: DashboardOrchestrator,
    private readonly budgetsOrchestrator: BudgetsOrchestrator,
  ) {}

  async build(
    userId: string,
    dto: AssistantMessageDto,
  ): Promise<AssistantContext> {
    const user = await this.usersService.getById(userId);
    const to = dto.period?.to ?? toIsoDate(new Date());
    const from =
      dto.period?.from ??
      toIsoDate(
        new Date(new Date(`${to}T00:00:00.000Z`).getTime() - 29 * DAY_MS),
      );
    if (from > to) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El período es inválido",
      );
    }
    const currency = dto.currency ?? user.baseCurrency;

    const dashboard = await this.dashboardOrchestrator.getDashboard(userId, {
      from,
      to,
      currency,
    });
    const { kpis } = dashboard;

    const topCategories = dashboard.expensesByCategory
      .slice(0, 5)
      .map((item) => ({ name: item.name, value: item.value }));

    const month = to.slice(0, 7);
    const budgets = await this.budgetsOrchestrator.listBudgets(userId, month);
    const budgetSummary = budgets.slice(0, 6).map((budget) => ({
      category: budget.category.name,
      limit: budget.limit,
      spent: budget.spent,
      consumedPct: Math.round(budget.consumedPct),
    }));

    const monthExpenses =
      dashboard.incomeExpenseByMonth.find((item) => item.month === month)
        ?.expenses ?? 0;

    const sources = new Set<string>(["transactions"]);
    if (budgets.length > 0) sources.add("budgets");
    if (dashboard.kpis.assets !== 0) sources.add("assets");
    if (dashboard.kpis.debts !== 0) sources.add("debts");
    if (dashboard.investments.positions.length > 0) sources.add("positions");

    const summary = [
      `Fecha de hoy: ${toIsoDate(new Date())}.`,
      `Período analizado: ${from} a ${to} (moneda ${currency}).`,
      `Ingresos del período: ${kpis.income}.`,
      `Gastos del período: ${kpis.expenses}.`,
      `Ahorro (ingresos - gastos): ${kpis.savings}.`,
      topCategories.length > 0
        ? `Mayores gastos por categoría: ${topCategories
            .map((item) => `${item.name} ${item.value}`)
            .join(", ")}.`
        : "Sin gastos por categoría en el período.",
      budgetSummary.length > 0
        ? `Presupuestos del mes: ${budgetSummary
            .map(
              (item) =>
                `${item.category} ${item.consumedPct}% (gastado ${item.spent} de ${item.limit})`,
            )
            .join(", ")}.`
        : "Sin presupuestos definidos para el mes.",
      `Patrimonio neto estimado: ${kpis.netWorth}.`,
      `Gastos totales del mes: ${monthExpenses}.`,
    ].join("\n");

    return {
      period: { from, to },
      currency,
      sources: [...sources],
      summary,
    };
  }
}

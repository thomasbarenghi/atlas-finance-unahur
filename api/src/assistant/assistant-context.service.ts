import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { DashboardOrchestrator } from "../dashboard/dashboard.orchestrator";
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
 * Builds the minimal, pre-calculated context sent to the LLM (FR-IA-002,
 * RN-013). It reuses the dashboard read model (the single source of truth for
 * CAL-001/CAL-002 aggregation) instead of re-deriving formulas, so the figures
 * it hands the model match the dashboard (AGENTS rule 7).
 */
@Injectable()
export class AssistantContextService {
  constructor(
    private readonly dashboardOrchestrator: DashboardOrchestrator,
    private readonly accountsService: AccountsService,
  ) {}

  async build(
    userId: string,
    dto: AssistantMessageDto,
  ): Promise<AssistantContext> {
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

    const [dashboard, accounts] = await Promise.all([
      this.dashboardOrchestrator.getDashboard(userId, {
        from,
        to,
        currency: dto.currency,
      }),
      this.accountsService.listAccounts(userId),
    ]);
    const { kpis } = dashboard;
    const displayCurrency = dashboard.currency;

    const topCategories = dashboard.expensesByCategory
      .slice(0, 5)
      .map((item) => `${item.name} ${item.value}`)
      .join(", ");

    const monthlyFlow = dashboard.incomeExpenseByMonth
      .map(
        (item) =>
          `${item.month}: ingresos ${item.income}, gastos ${item.expenses}`,
      )
      .join("; ");

    const accountBalances = accounts
      .map(
        (account) =>
          `${account.name} (${account.type}, ${account.currency}) ${account.currentBalance}`,
      )
      .join(", ");

    const breakdown = (dashboard.breakdown ?? [])
      .map(
        (item) =>
          `${item.currency} ${item.balance}${
            item.currency === displayCurrency
              ? ""
              : ` (≈ ${item.converted} ${displayCurrency})`
          }`,
      )
      .join(", ");

    const summary = [
      `Fecha de hoy: ${toIsoDate(new Date())}.`,
      `Período analizado: ${from} a ${to}.`,
      `Alcance de moneda de los indicadores: ${dashboard.currency}. Los flujos se calculan por moneda y no se suman entre monedas.`,
      `Ingresos del período (${dashboard.currency}): ${kpis.income}.`,
      `Gastos del período (${dashboard.currency}): ${kpis.expenses}.`,
      `Ahorro (ingresos - gastos, ${dashboard.currency}): ${kpis.savings}.`,
      topCategories
        ? `Mayores gastos por categoría del período (${dashboard.currency}): ${topCategories}.`
        : "Sin gastos por categoría en el período.",
      `Patrimonio neto en ${displayCurrency} (Σ saldos convertidos con la cotización de Ajustes): ${kpis.netWorth}.`,
      breakdown
        ? `Desglose del patrimonio por moneda: ${breakdown}.`
        : "El usuario no tiene cuentas.",
      `Moneda de lectura: ${displayCurrency}. El patrimonio convertido solo se informa con su desglose por moneda.`,
      monthlyFlow
        ? `Evolución mensual (ingresos/gastos, ${dashboard.currency}): ${monthlyFlow}.`
        : "Sin evolución mensual en el período.",
      accountBalances
        ? `Saldos de cuentas del usuario (cada uno en su moneda): ${accountBalances}.`
        : "El usuario no tiene cuentas.",
    ].join("\n");

    return {
      period: { from, to },
      currency: dashboard.currency,
      sources: ["transactions", "accounts", "categories", "currencies"],
      summary,
    };
  }
}

import { Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import type { AccountResponseDto } from "../accounts/dto/account-response.dto";
import { DashboardOrchestrator } from "../dashboard/dashboard.orchestrator";
import type { DashboardData } from "../dashboard/dto/dashboard-response.dto";
import { AssistantMessageDto } from "./dto/assistant-message.dto";

export interface AssistantContext {
  period: { from: string; to: string };
  currency: string;
  sources: string[];
  summary: string;
}

const DAY_MS = 86_400_000;
const DEFAULT_PERIOD_DAYS = 30;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const formatAmount = (value: number, currency: string): string =>
  `${value} ${currency}`;

interface AssistantContextData {
  period: DashboardData["period"];
  currency: string;
  kpis: DashboardData["kpis"];
  expensesByCategory: DashboardData["expensesByCategory"];
  incomeExpenseByMonth: DashboardData["incomeExpenseByMonth"];
  breakdown: DashboardData["breakdown"];
  accounts: AccountResponseDto[];
}

/**
 * Builds the minimal, pre-calculated context sent to the LLM (FR-IA-002). It
 * reuses the dashboard read model so the figures match the UI, and keeps the
 * formatting separate from data loading. The reported net worth is the current
 * account balance, not a historical valuation at the end of the period.
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
    const data = await this.loadData(userId, dto);

    return {
      period: data.period,
      currency: data.currency,
      sources: ["transactions", "accounts", "categories", "currencies"],
      summary: this.formatSummary(data),
    };
  }

  private async loadData(
    userId: string,
    dto: AssistantMessageDto,
  ): Promise<AssistantContextData> {
    const to = dto.period?.to ?? toIsoDate(new Date());
    const from =
      dto.period?.from ??
      toIsoDate(
        new Date(
          new Date(`${to}T00:00:00.000Z`).getTime() -
            (DEFAULT_PERIOD_DAYS - 1) * DAY_MS,
        ),
      );

    const [dashboard, accounts] = await Promise.all([
      this.dashboardOrchestrator.getDashboard(userId, {
        from,
        to,
        currency: dto.currency,
      }),
      this.accountsService.listAccounts(userId),
    ]);

    return {
      period: dashboard.period,
      currency: dashboard.currency,
      kpis: dashboard.kpis,
      expensesByCategory: dashboard.expensesByCategory,
      incomeExpenseByMonth: dashboard.incomeExpenseByMonth,
      breakdown: dashboard.breakdown,
      accounts,
    };
  }

  private formatSummary(data: AssistantContextData): string {
    const {
      period,
      currency,
      kpis,
      expensesByCategory,
      incomeExpenseByMonth,
      breakdown,
      accounts,
    } = data;

    const topCategories = expensesByCategory
      .slice(0, 5)
      .map((item) => `${item.name}: ${formatAmount(item.value, currency)}`)
      .join(", ");

    const monthlyFlow = incomeExpenseByMonth
      .map(
        (item) =>
          `${item.month}: ingresos ${formatAmount(item.income, currency)}, ` +
          `gastos ${formatAmount(item.expenses, currency)}`,
      )
      .join("; ");

    const accountBalances = accounts
      .map(
        (account) =>
          `${account.name} (${account.type}, ${account.currency}): ` +
          formatAmount(account.currentBalance, account.currency),
      )
      .join(", ");

    const breakdownByCurrency = breakdown
      .map(
        (item) =>
          `${item.currency} ${formatAmount(item.balance, item.currency)}` +
          (item.currency === currency
            ? ""
            : ` (≈ ${formatAmount(item.converted, currency)})`),
      )
      .join(", ");

    return [
      `Fecha de referencia (UTC): ${toIsoDate(new Date())}.`,
      `Período analizado (fechas calendario): ${period.from} a ${period.to}.`,
      `Moneda de lectura: ${currency}. Los importes de ingresos, gastos, ahorro y categorías se convierten a ${currency} antes de agregarse; no se suman importes sin convertir.`,
      `Ingresos del período (${currency}): ${formatAmount(kpis.income, currency)}.`,
      `Gastos del período (${currency}): ${formatAmount(kpis.expenses, currency)}.`,
      `Ahorro (ingresos - gastos, ${currency}): ${formatAmount(kpis.savings, currency)}.`,
      topCategories
        ? `Mayores gastos por categoría del período (${currency}): ${topCategories}.`
        : "Sin gastos por categoría en el período.",
      `Patrimonio neto actual en ${currency}: ${formatAmount(kpis.netWorth, currency)}. Es el saldo actual de las cuentas, no una valoración histórica al cierre del período; se convierte con la cotización actual.`,
      breakdownByCurrency
        ? `Desglose del patrimonio por moneda: ${breakdownByCurrency}.`
        : "Sin desglose por moneda.",
      monthlyFlow
        ? `Evolución mensual (ingresos/gastos, ${currency}): ${monthlyFlow}.`
        : "Sin evolución mensual en el período.",
      accountBalances
        ? `Saldos de cuentas del usuario (cada uno en su moneda): ${accountBalances}.`
        : "Sin cuentas.",
    ].join("\n");
  }
}

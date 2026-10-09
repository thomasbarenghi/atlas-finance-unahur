import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { AssetsService } from "../assets/assets.service";
import { BudgetsOrchestrator } from "../budgets/budgets.orchestrator";
import { CategoriesService } from "../categories/categories.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { DebtsService } from "../debts/debts.service";
import { PositionsService } from "../positions/positions.service";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { TransactionsService } from "../transactions/transactions.service";
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
 * RN-013). It coordinates the finance services instead of querying their
 * repositories, and holds no database queries of its own.
 */
@Injectable()
export class AssistantContextService {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsOrchestrator: BudgetsOrchestrator,
    private readonly accountsService: AccountsService,
    private readonly assetsService: AssetsService,
    private readonly debtsService: DebtsService,
    private readonly positionsService: PositionsService,
    private readonly calculations: CalculationsService,
  ) {}

  async build(
    userId: string,
    dto: AssistantMessageDto,
  ): Promise<AssistantContext> {
    const user = await this.usersService.getById(userId);
    const to = dto.period?.to ?? toIsoDate(new Date());
    const from =
      dto.period?.from ??
      toIsoDate(new Date(new Date(to).getTime() - 29 * DAY_MS));
    if (from > to) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El período es inválido",
      );
    }
    const currency = dto.currency ?? user.baseCurrency;
    const sources = new Set<string>(["transactions"]);

    const [transactions, categories] = await Promise.all([
      this.transactionsService.listOwnedTransactions(userId),
      this.categoriesService.listCategories(userId),
    ]);
    const categoryNameById = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const categoryName = (id: string | null): string =>
      (id ? categoryNameById.get(id) : undefined) ?? "Sin categoría";

    const flows = this.calculations.calculatePeriodFlows(
      transactions,
      from,
      to,
    );

    const periodExpensesByCategory =
      this.calculations.calculateExpensesByCategory(transactions, from, to);
    const topCategories = [...periodExpensesByCategory.entries()]
      .map(([categoryId, value]) => ({
        name: categoryName(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value)
      .slice(0, 5);

    const month = to.slice(0, 7);
    const budgets = await this.budgetsOrchestrator.listBudgets(userId, month);
    if (budgets.length > 0) sources.add("budgets");
    const budgetSummary = budgets.slice(0, 6).map((budget) => ({
      category: budget.category.name,
      limit: budget.limit,
      spent: budget.spent,
      consumedPct: Math.round(budget.consumedPct),
    }));

    const accounts = await this.accountsService.listOwnedAccounts(userId);
    const cash = this.calculations.calculateCashBalance(accounts, transactions);

    const assets = await this.assetsService.listOwnedAssets(userId);
    const valuations = await this.assetsService.listValuationsForUser(userId);
    const assetsValue = this.calculations.getLatestValuationsTotal(valuations);
    if (assets.length > 0) sources.add("assets");

    const debts = await this.debtsService.listOwnedDebts(userId);
    const debtTotal = debts
      .filter((debt) => !debt.archived)
      .reduce((total, debt) => total + debt.balance, 0);
    if (debts.length > 0) sources.add("debts");

    const positions = await this.positionsService.listOwnedPositions(userId);
    const positionsCost = this.calculations.calculatePositionsCost(positions);
    if (positions.length > 0) sources.add("positions");

    const netWorth = this.calculations.calculateNetWorth({
      assets: assetsValue,
      positions: positionsCost,
      cash,
      debts: debtTotal,
    });
    const monthExpenses = this.calculations.calculateMonthExpenses(
      transactions,
      month,
    );

    const summary = [
      `Fecha de hoy: ${toIsoDate(new Date())}.`,
      `Período analizado: ${from} a ${to} (moneda ${currency}).`,
      `Ingresos del período: ${flows.income}.`,
      `Gastos del período: ${flows.expenses}.`,
      `Ahorro (ingresos - gastos): ${flows.savings}.`,
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
      `Patrimonio neto estimado: ${netWorth}.`,
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

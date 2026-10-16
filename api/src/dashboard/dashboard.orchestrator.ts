import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccountsService } from "../accounts/accounts.service";
import { Account } from "../accounts/entities/account.entity";
import { CategoriesService } from "../categories/categories.service";
import { AppConfig } from "../config/configuration";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { TransactionsService } from "../transactions/transactions.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData } from "./dto/dashboard-response.dto";

const DAY_MS = 86_400_000;
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Read-model orchestrator for the dashboard (FR-DAS-001..004, FR-DAS-007/008).
 * It coordinates the primary services and holds no database queries.
 * CAL-001 (net worth = Σ account balances), CAL-002/CAL-003 and CAL-010 are
 * assembled here reusing `calculations.service` (backend.md §8).
 */
@Injectable()
export class DashboardOrchestrator {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
    private readonly calculations: CalculationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getDashboard(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardData> {
    const today = toIsoDate(new Date());
    const to = query.to ?? today;
    const from =
      query.from ??
      toIsoDate(
        new Date(new Date(`${to}T00:00:00.000Z`).getTime() - 180 * DAY_MS),
      );
    const currency = this.config.get("defaultCurrency", { infer: true });

    const [transactions, categories, accounts] = await Promise.all([
      this.transactionsService.listOwnedTransactions(userId),
      this.categoriesService.listCategories(),
      this.accountsService.listOwnedAccounts(userId),
    ]);

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const categoryName = (id: string | null): string =>
      (id ? categoryById.get(id)?.name : undefined) ?? "Sin categoría";
    const categoryColor = (id: string): string =>
      categoryById.get(id)?.color ?? "#64748b";

    const current = this.calculations.calculatePeriodFlows(
      transactions,
      from,
      to,
    );
    const previous = this.calculations.previousRange(from, to);
    const previousFlow = this.calculations.calculatePeriodFlows(
      transactions,
      previous.from,
      previous.to,
    );

    const months = this.calculations.monthRange(from, to);

    const incomeExpenseByMonth = months.map((month) => {
      const flows = this.calculations.calculatePeriodFlows(
        transactions,
        `${month}-01`,
        this.calculations.monthEnd(month),
      );
      return { month, income: flows.income, expenses: flows.expenses };
    });

    const currentByCategory = this.calculations.calculateExpensesByCategory(
      transactions,
      from,
      to,
    );
    const expensesByCategory = [...currentByCategory.entries()]
      .map(([categoryId, value]) => ({
        categoryId,
        name: categoryName(categoryId),
        color: categoryColor(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value);

    // CAL-001: net worth is the sum of the account balances. Past points of the
    // series are the same sum evaluated at the end of each month.
    const balanceOf = (account: Account, end?: string): number => {
      let balance = account.initialBalance;
      for (const transaction of transactions) {
        if (transaction.accountId !== account.id) continue;
        if (end && transaction.date > end) continue;
        balance +=
          transaction.type === "expense"
            ? -transaction.amount
            : transaction.amount;
      }
      return balance;
    };

    const netWorth = accounts.reduce(
      (total, account) => total + balanceOf(account),
      0,
    );

    const netWorthSeries = months.map((month) => {
      const date = this.calculations.monthEnd(month);
      return {
        date,
        value: accounts.reduce(
          (total, account) => total + balanceOf(account, date),
          0,
        ),
      };
    });

    const seriesStart = netWorthSeries[0];
    const savingsRateDeltaPp =
      ((current.income > 0 ? current.savings / current.income : 0) -
        (previousFlow.income > 0
          ? previousFlow.savings / previousFlow.income
          : 0)) *
      100;

    return {
      period: { from, to },
      currency,
      kpis: {
        netWorth,
        netWorthDeltaPct: seriesStart
          ? this.calculations.pctDelta(netWorth, seriesStart.value)
          : null,
        income: current.income,
        incomeDeltaPct: this.calculations.pctDelta(
          current.income,
          previousFlow.income,
        ),
        expenses: current.expenses,
        expensesDeltaPct: this.calculations.pctDelta(
          current.expenses,
          previousFlow.expenses,
        ),
        savings: current.savings,
        savingsDeltaPct: this.calculations.pctDelta(
          current.savings,
          previousFlow.savings,
        ),
        savingsRateDeltaPp,
      },
      netWorthSeries,
      incomeExpenseByMonth,
      expensesByCategory,
    };
  }
}

import { Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { CategoriesService } from "../categories/categories.service";
import { CurrenciesService } from "../currencies/currencies.service";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { TransactionsService } from "../transactions/transactions.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import {
  DashboardBreakdown,
  DashboardData,
  DashboardRate,
} from "./dto/dashboard-response.dto";

const DAY_MS = 86_400_000;
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Read-model orchestrator for the dashboard (FR-DAS-001..004, FR-DAS-007/008).
 * It coordinates the primary services and holds no database queries.
 *
 * Multimoneda (RN-014..020, CH-71/CH-77):
 * - `currency` is the reading/display currency for the whole dashboard; every
 *   flow and the net worth are converted with the API quote (default: primary).
 *   Changing it never alters records (RN-019).
 * - `primaryCurrency` is still reported for settings/assistant context.
 * - The transfer rate override is not persisted; each leg stores its own amount.
 */
@Injectable()
export class DashboardOrchestrator {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
    private readonly calculations: CalculationsService,
    private readonly currencies: CurrenciesService,
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

    const rateContext = await this.currencies.getRateContext(userId);
    const displayCurrency = query.currency ?? rateContext.primaryCurrency;

    const [transactions, categories, accounts] = await Promise.all([
      this.transactionsService.listOwnedTransactions(userId),
      this.categoriesService.listCategories(userId),
      this.accountsService.listOwnedAccounts(userId),
    ]);

    const currencyByAccount = new Map(
      accounts.map((account) => [account.id, account.currency ?? "ARS"]),
    );
    // Period indicators aggregate every currency, converting each flow with
    // the API quote to the display currency (default: primary currency).
    const displayedTransactions = transactions.map((transaction) => {
      const sourceCurrency =
        currencyByAccount.get(transaction.accountId) ??
        rateContext.primaryCurrency;
      return {
        ...transaction,
        currency: displayCurrency,
        amount: this.calculations.convertAmount(
          transaction.amount,
          sourceCurrency,
          displayCurrency,
          rateContext.rates,
        ),
      };
    });

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const categoryName = (id: string | null): string =>
      (id ? categoryById.get(id)?.name : undefined) ?? "Sin categoría";
    const categoryColor = (id: string): string =>
      categoryById.get(id)?.color ?? "#64748b";

    const current = this.calculations.calculatePeriodFlows(
      displayedTransactions,
      from,
      to,
      displayCurrency,
    );
    const previous = this.calculations.previousRange(from, to);
    const previousFlow = this.calculations.calculatePeriodFlows(
      displayedTransactions,
      previous.from,
      previous.to,
      displayCurrency,
    );

    const months = this.calculations.monthRange(from, to);
    const rangeDays =
      Math.round(
        (new Date(`${to}T00:00:00.000Z`).getTime() -
          new Date(`${from}T00:00:00.000Z`).getTime()) /
          DAY_MS,
      ) + 1;
    const dailyGranularity = rangeDays <= 31;

    const incomeExpenseByMonth = months.map((month) => {
      const flows = this.calculations.calculatePeriodFlows(
        displayedTransactions,
        `${month}-01`,
        this.calculations.monthEnd(month),
        displayCurrency,
      );
      return { month, income: flows.income, expenses: flows.expenses };
    });

    const incomeExpenseByPeriod = dailyGranularity
      ? this.calculations.weekRange(from, to).map(({ start, end }) => {
          const flows = this.calculations.calculatePeriodFlows(
            displayedTransactions,
            start,
            end,
            displayCurrency,
          );
          return {
            bucket: "week" as const,
            start,
            end,
            income: flows.income,
            expenses: flows.expenses,
          };
        })
      : months.map((month) => {
          const start = `${month}-01`;
          const end = this.calculations.monthEnd(month);
          const flows = this.calculations.calculatePeriodFlows(
            displayedTransactions,
            start,
            end,
            displayCurrency,
          );
          return {
            bucket: "month" as const,
            start,
            end,
            income: flows.income,
            expenses: flows.expenses,
          };
        });

    const currentByCategory = this.calculations.calculateExpensesByCategory(
      displayedTransactions,
      from,
      to,
      displayCurrency,
    );
    const expensesByCategory = [...currentByCategory.entries()]
      .map(([categoryId, value]) => ({
        categoryId,
        name: categoryName(categoryId),
        color: categoryColor(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value);

    // CAL-001: each account balance is converted to the display currency.
    const netWorth = this.calculations.netWorthInCurrency(
      accounts,
      transactions,
      rateContext.rates,
      displayCurrency,
    );

    const netWorthSeries = dailyGranularity
      ? this.calculations.dayRange(from, to).map((date) => ({
          date,
          value: this.calculations.netWorthInCurrency(
            accounts,
            transactions,
            rateContext.rates,
            displayCurrency,
            date,
          ),
        }))
      : months.map((month) => {
          const date = this.calculations.monthEnd(month);
          return {
            date,
            value: this.calculations.netWorthInCurrency(
              accounts,
              transactions,
              rateContext.rates,
              displayCurrency,
              date,
            ),
          };
        });

    const breakdown = this.buildBreakdown(
      accounts,
      transactions,
      rateContext,
      displayCurrency,
    );
    const availableCurrencies = this.buildAvailableCurrencies(
      accounts,
      displayCurrency,
      rateContext.primaryCurrency,
    );
    const rates = availableCurrencies.map((currency) =>
      this.buildRate(currency, rateContext, displayCurrency),
    );

    const seriesStart = netWorthSeries[0];
    const savingsRateDeltaPp =
      ((current.income > 0 ? current.savings / current.income : 0) -
        (previousFlow.income > 0
          ? previousFlow.savings / previousFlow.income
          : 0)) *
      100;

    return {
      period: { from, to },
      currency: displayCurrency,
      primaryCurrency: rateContext.primaryCurrency,
      rateDate: rateContext.rateDate,
      availableCurrencies,
      breakdown,
      rates,
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
      incomeExpenseByPeriod,
      incomeExpenseByMonth,
      expensesByCategory,
    };
  }

  private buildBreakdown(
    accounts: Awaited<ReturnType<AccountsService["listOwnedAccounts"]>>,
    transactions: Awaited<
      ReturnType<TransactionsService["listOwnedTransactions"]>
    >,
    rateContext: Awaited<ReturnType<CurrenciesService["getRateContext"]>>,
    targetCurrency: string,
  ): DashboardBreakdown[] {
    const byCurrency = new Map<string, { balance: number; accounts: number }>();
    for (const account of accounts) {
      const currency = account.currency ?? "ARS";
      const bucket = byCurrency.get(currency) ?? { balance: 0, accounts: 0 };
      bucket.balance += this.calculations.balanceAt(account, transactions);
      bucket.accounts += 1;
      byCurrency.set(currency, bucket);
    }

    return [...byCurrency.entries()]
      .map(([currency, bucket]) => ({
        currency,
        balance: bucket.balance,
        accounts: bucket.accounts,
        converted: this.calculations.convertAmount(
          bucket.balance,
          currency,
          targetCurrency,
          rateContext.rates,
        ),
      }))
      .sort((first, second) => {
        if (first.currency === targetCurrency) return -1;
        if (second.currency === targetCurrency) return 1;
        return second.converted - first.converted;
      });
  }

  private buildAvailableCurrencies(
    accounts: Awaited<ReturnType<AccountsService["listOwnedAccounts"]>>,
    scope: string,
    primaryCurrency: string,
  ): string[] {
    const used = [
      ...new Set([
        ...accounts.map((account) => account.currency),
        primaryCurrency,
      ]),
    ];
    if (!used.includes(scope)) used.push(scope);
    return used.sort((first, second) => {
      if (first === primaryCurrency) return -1;
      if (second === primaryCurrency) return 1;
      return first.localeCompare(second);
    });
  }

  private buildRate(
    currency: string,
    rateContext: Awaited<ReturnType<CurrenciesService["getRateContext"]>>,
    targetCurrency: string,
  ): DashboardRate {
    return {
      currency,
      rate: this.calculations.convertAmount(
        1,
        currency,
        targetCurrency,
        rateContext.rates,
      ),
      rateDate:
        rateContext.rateDates.get(currency) ??
        rateContext.rateDate ??
        toIsoDate(new Date()),
    };
  }
}

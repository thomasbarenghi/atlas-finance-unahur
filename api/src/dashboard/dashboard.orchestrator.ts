import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { CategoriesService } from "../categories/categories.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { BASE_CURRENCY } from "../currencies/currency-catalog";
import { CurrenciesService } from "../currencies/currencies.service";
import { CalculationsService } from "../shared/calculations/calculations.service";
import type { BalanceMap } from "../shared/calculations/calculations.types";
import { TransactionsService } from "../transactions/transactions.service";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import {
  DashboardBreakdown,
  DashboardData,
  DashboardRate,
} from "./dto/dashboard-response.dto";

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 366;
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

type RateContext = Awaited<ReturnType<CurrenciesService["getRateContext"]>>;
type AccountList = Awaited<ReturnType<AccountsService["listOwnedAccounts"]>>;
type TransactionList = Awaited<
  ReturnType<TransactionsService["listOwnedTransactions"]>
>;
type CategoryList = Awaited<ReturnType<CategoriesService["listCategories"]>>;
type DailyFlows = ReturnType<CalculationsService["calculateDailyFlows"]>;
type DashboardPeriod = DashboardData["period"];

interface DashboardSources {
  accounts: AccountList;
  transactions: TransactionList;
  categories: CategoryList;
  rateContext: RateContext;
}

interface DashboardScope {
  sources: DashboardSources;
  transactions: TransactionList;
  dailyFlows: DailyFlows;
  balances: BalanceMap;
  period: DashboardPeriod;
  currency: string;
}

type DashboardCurrencyData = Pick<
  DashboardData,
  "availableCurrencies" | "breakdown" | "rates"
>;
type DashboardCharts = Pick<
  DashboardData,
  | "netWorthSeries"
  | "incomeExpenseByPeriod"
  | "incomeExpenseByMonth"
  | "expensesByCategory"
>;
type DashboardKpis = Pick<DashboardData, "kpis">;

/**
 * Read-model orchestrator for the dashboard (FR-DAS-001/002/003).
 * It coordinates the primary services and holds no database queries.
 *
 * Multimoneda (RN-001, CH-71/CH-77):
 * - `currency` is the reading/display currency for the whole dashboard; every
 *   flow and the net worth are converted with the API quote (default: primary).
 *   Changing it never alters records (RN-001).
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
    const period = this.resolvePeriod(query);
    const data = await this.loadData(userId);
    const currency = query.currency ?? data.rateContext.primaryCurrency;
    const transactions = this.convertTransactions(
      data.transactions,
      data.accounts,
      data.rateContext,
      currency,
    );
    const scope: DashboardScope = {
      sources: data,
      transactions,
      dailyFlows: this.calculations.calculateDailyFlows(transactions, currency),
      balances: this.calculations.calculateAccountBalances(
        data.accounts,
        data.transactions,
      ),
      period,
      currency,
    };
    const charts = this.buildCharts(scope);

    return {
      period,
      currency,
      primaryCurrency: data.rateContext.primaryCurrency,
      rateDate: data.rateContext.rateDate,
      ...this.buildCurrencyData(scope),
      ...this.buildKpis(scope, charts.netWorthSeries),
      ...charts,
    };
  }

  private resolvePeriod(query: DashboardQueryDto): DashboardPeriod {
    const to = query.to ?? toIsoDate(new Date());
    const from =
      query.from ??
      toIsoDate(
        new Date(new Date(`${to}T00:00:00.000Z`).getTime() - 180 * DAY_MS),
      );
    const period = { from, to };
    const days = this.rangeDays(period);

    if (days < 1 || days > MAX_RANGE_DAYS) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `El período debe tener entre 1 y ${MAX_RANGE_DAYS} días`,
      );
    }

    return period;
  }

  private rangeDays(period: DashboardPeriod): number {
    return (
      Math.round(
        (new Date(`${period.to}T00:00:00.000Z`).getTime() -
          new Date(`${period.from}T00:00:00.000Z`).getTime()) /
          DAY_MS,
      ) + 1
    );
  }

  private async loadData(userId: string): Promise<DashboardSources> {
    const [rateContext, transactions, categories, accounts] = await Promise.all(
      [
        this.currencies.getRateContext(userId),
        this.transactionsService.listOwnedTransactions(userId),
        this.categoriesService.listCategories(userId),
        this.accountsService.listOwnedAccounts(userId),
      ],
    );
    return { accounts, transactions, categories, rateContext };
  }

  private convertTransactions(
    transactions: TransactionList,
    accounts: AccountList,
    rateContext: RateContext,
    displayCurrency: string,
  ): TransactionList {
    const currencyByAccount = new Map(
      accounts.map((account) => [
        account.id,
        account.currency ?? BASE_CURRENCY,
      ]),
    );

    return transactions.map((transaction) => {
      const sourceCurrency =
        transaction.currency ?? currencyByAccount.get(transaction.accountId);

      if (!sourceCurrency) {
        throw new ApiException(
          ErrorCode.INTERNAL_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
          "El movimiento no tiene una cuenta asociada",
        );
      }

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
  }

  private buildCurrencyData(scope: DashboardScope): DashboardCurrencyData {
    const { sources, currency } = scope;
    const availableCurrencies = this.buildAvailableCurrencies(
      sources.accounts,
      currency,
      sources.rateContext.primaryCurrency,
    );

    return {
      availableCurrencies,
      breakdown: this.buildBreakdown(
        sources.accounts,
        scope.balances,
        sources.rateContext,
        currency,
      ),
      rates: availableCurrencies.map((value) =>
        this.buildRate(value, sources.rateContext, currency),
      ),
    };
  }

  private buildKpis(
    scope: DashboardScope,
    netWorthSeries: DashboardData["netWorthSeries"],
  ): DashboardKpis {
    const { sources, dailyFlows, period, currency } = scope;
    const current = this.calculations.sumFlows(
      dailyFlows,
      period.from,
      period.to,
    );
    const previous = this.calculations.previousRange(period.from, period.to);
    const previousFlow = this.calculations.sumFlows(
      dailyFlows,
      previous.from,
      previous.to,
    );
    const netWorth = this.calculations.netWorthFromBalances(
      sources.accounts,
      scope.balances,
      sources.rateContext.rates,
      currency,
    );
    const seriesStart = netWorthSeries[0];
    const savingsRateDeltaPp =
      ((current.income > 0 ? current.savings / current.income : 0) -
        (previousFlow.income > 0
          ? previousFlow.savings / previousFlow.income
          : 0)) *
      100;

    return {
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
    };
  }

  private buildCharts(scope: DashboardScope): DashboardCharts {
    const { sources, transactions, dailyFlows, period, currency } = scope;
    const flowsFor = (start: string, end: string) =>
      this.calculations.sumFlows(dailyFlows, start, end);

    const months = this.calculations.monthRange(period.from, period.to);
    const dailyGranularity = this.rangeDays(period) <= 31;

    const incomeExpenseByMonth = months.map((month) => {
      const flows = flowsFor(`${month}-01`, this.calculations.monthEnd(month));
      return { month, income: flows.income, expenses: flows.expenses };
    });

    const periods = dailyGranularity
      ? this.calculations
          .weekRange(period.from, period.to)
          .map(({ start, end }) => ({ bucket: "week" as const, start, end }))
      : months.map((month) => ({
          bucket: "month" as const,
          start: `${month}-01`,
          end: this.calculations.monthEnd(month),
        }));

    const incomeExpenseByPeriod = periods.map(({ bucket, start, end }) => {
      const flows = flowsFor(start, end);
      return {
        bucket,
        start,
        end,
        income: flows.income,
        expenses: flows.expenses,
      };
    });

    const categoryById = new Map(
      sources.categories.map((category) => [category.id, category]),
    );
    const currentByCategory = this.calculations.calculateExpensesByCategory(
      transactions,
      period.from,
      period.to,
      currency,
    );
    const expensesByCategory = [...currentByCategory.entries()]
      .map(([categoryId, value]) => ({
        categoryId,
        name:
          (categoryId ? categoryById.get(categoryId)?.name : undefined) ??
          "Sin categoría",
        color: categoryById.get(categoryId)?.color ?? "#64748b",
        value,
      }))
      .sort((first, second) => second.value - first.value);

    const seriesDates = dailyGranularity
      ? this.calculations.dayRange(period.from, period.to)
      : months.map((month) => this.calculations.monthEnd(month));

    const netWorthSeries = this.calculations.netWorthSeries(
      sources.accounts,
      sources.transactions,
      sources.rateContext.rates,
      currency,
      seriesDates,
    );

    return {
      netWorthSeries,
      incomeExpenseByPeriod,
      incomeExpenseByMonth,
      expensesByCategory,
    };
  }

  private buildBreakdown(
    accounts: AccountList,
    balances: BalanceMap,
    rateContext: RateContext,
    displayCurrency: string,
  ): DashboardBreakdown[] {
    const byCurrency = new Map<string, { balance: number; accounts: number }>();
    for (const account of accounts) {
      const currency = account.currency ?? BASE_CURRENCY;
      const bucket = byCurrency.get(currency) ?? { balance: 0, accounts: 0 };
      bucket.balance += balances.get(account.id) ?? 0;
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
          displayCurrency,
          rateContext.rates,
        ),
      }))
      .sort((first, second) => {
        if (first.currency === displayCurrency) return -1;
        if (second.currency === displayCurrency) return 1;
        return second.converted - first.converted;
      });
  }

  private buildAvailableCurrencies(
    accounts: AccountList,
    displayCurrency: string,
    primaryCurrency: string,
  ): string[] {
    const currencies = new Set([
      ...accounts.map((account) => account.currency ?? BASE_CURRENCY),
      primaryCurrency,
      displayCurrency,
    ]);
    return [...currencies].sort((first, second) => {
      if (first === primaryCurrency) return -1;
      if (second === primaryCurrency) return 1;
      return first.localeCompare(second);
    });
  }

  private buildRate(
    currency: string,
    rateContext: RateContext,
    displayCurrency: string,
  ): DashboardRate {
    return {
      currency,
      rate: this.calculations.convertAmount(
        1,
        currency,
        displayCurrency,
        rateContext.rates,
      ),
      rateDate: rateContext.rateDate ?? toIsoDate(new Date()),
    };
  }
}

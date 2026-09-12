import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { AppConfig } from "../config/configuration";
import { BudgetsService } from "../budgets/budgets.service";
import { Category } from "../categories/entities/category.entity";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { Debt } from "../debts/entities/debt.entity";
import { Position } from "../positions/entities/position.entity";
import { Quote } from "../quotes/entities/quote.entity";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { FxService } from "../fx/fx.service";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";
import { DashboardQueryDto } from "./dto/dashboard-query.dto";
import { DashboardData } from "./dto/dashboard-response.dto";

const DAY_MS = 86_400_000;
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const signedAmount = (transaction: Transaction): number =>
  transaction.type === "expense" ? -transaction.amount : transaction.amount;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(Valuation)
    private readonly valuationsRepository: Repository<Valuation>,
    @InjectRepository(Debt)
    private readonly debtsRepository: Repository<Debt>,
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    private readonly calculations: CalculationsService,
    private readonly fxService: FxService,
    private readonly budgetsService: BudgetsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getDashboard(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardData> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const today = toIsoDate(new Date());
    const to = query.to ?? today;
    const from =
      query.from ??
      toIsoDate(
        new Date(new Date(`${to}T00:00:00.000Z`).getTime() - 180 * DAY_MS),
      );
    const currency = (query.currency ?? user.baseCurrency).toUpperCase();

    const [
      transactions,
      categories,
      accounts,
      assets,
      debts,
      positions,
      quotes,
    ] = await Promise.all([
      this.transactionsRepository.find({ where: { userId } }),
      this.categoriesRepository.find({
        where: [{ userId }, { userId: IsNull() }],
      }),
      this.accountsRepository.find({ where: { userId } }),
      this.assetsRepository.find({ where: { userId } }),
      this.debtsRepository.find({ where: { userId } }),
      this.positionsRepository.find({ where: { userId } }),
      this.quotesRepository.find(),
    ]);

    const assetIds = assets.map((asset) => asset.id);
    const valuations =
      assetIds.length > 0
        ? await this.valuationsRepository.find({
            where: { assetId: In(assetIds) },
          })
        : [];

    const convert = await this.fxService.getConverter();
    const money = (amount: number, source: string): number =>
      convert(amount, source, currency);

    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const categoryName = (id: string | null): string =>
      (id ? categoryById.get(id)?.name : undefined) ?? "Sin categoría";
    const categoryColor = (id: string): string =>
      categoryById.get(id)?.color ?? "#64748b";

    const flowsBetween = (start: string, end: string) => {
      let income = 0;
      let expenses = 0;
      for (const transaction of transactions) {
        if (transaction.date < start || transaction.date > end) continue;
        if (transaction.type === "income") {
          income += money(transaction.amount, transaction.currency);
        } else if (transaction.type === "expense") {
          expenses += money(transaction.amount, transaction.currency);
        }
      }
      return { income, expenses, savings: income - expenses };
    };

    const current = flowsBetween(from, to);
    const previous = this.calculations.previousRange(from, to);
    const previousFlow = flowsBetween(previous.from, previous.to);

    const months = this.calculations.monthRange(from, to);

    const incomeExpenseByMonth = months.map((month) => {
      let income = 0;
      let expenses = 0;
      for (const transaction of transactions) {
        if (transaction.date.slice(0, 7) !== month) continue;
        if (transaction.type === "income") {
          income += money(transaction.amount, transaction.currency);
        } else if (transaction.type === "expense") {
          expenses += money(transaction.amount, transaction.currency);
        }
      }
      return { month, income, expenses };
    });

    const categoryTotals = (
      start: string,
      end: string,
    ): Map<string, number> => {
      const totals = new Map<string, number>();
      for (const transaction of transactions) {
        if (
          transaction.type !== "expense" ||
          !transaction.categoryId ||
          transaction.date < start ||
          transaction.date > end
        ) {
          continue;
        }
        totals.set(
          transaction.categoryId,
          (totals.get(transaction.categoryId) ?? 0) +
            money(transaction.amount, transaction.currency),
        );
      }
      return totals;
    };

    const currentByCategory = categoryTotals(from, to);
    const previousByCategory = categoryTotals(previous.from, previous.to);
    const expensesByCategory = [...currentByCategory.entries()]
      .map(([categoryId, value]) => ({
        categoryId,
        name: categoryName(categoryId),
        color: categoryColor(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value);

    const categoryChanges = expensesByCategory
      .map((item) => {
        const previousValue = previousByCategory.get(item.categoryId) ?? 0;
        return {
          categoryId: item.categoryId,
          name: item.name,
          current: item.value,
          previous: previousValue,
          deltaPct: this.calculations.pctDelta(item.value, previousValue),
        };
      })
      .sort(
        (first, second) =>
          Math.abs(second.current - second.previous) -
          Math.abs(first.current - first.previous),
      );

    const incomeByCategory = new Map<string, number>();
    for (const transaction of transactions) {
      if (
        transaction.type !== "income" ||
        transaction.date < from ||
        transaction.date > to
      ) {
        continue;
      }
      const key = transaction.categoryId ?? "other";
      incomeByCategory.set(
        key,
        (incomeByCategory.get(key) ?? 0) +
          money(transaction.amount, transaction.currency),
      );
    }
    const incomeSources = [...incomeByCategory.entries()]
      .map(([categoryId, value]) => ({
        name:
          categoryId === "other" ? "Otros ingresos" : categoryName(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value);

    const activeAccounts = accounts.filter((account) => !account.archived);
    const balanceOf = (account: Account, end?: string): number => {
      let balance = account.initialBalance;
      for (const transaction of transactions) {
        if (transaction.accountId !== account.id) continue;
        if (end && transaction.date > end) continue;
        balance += signedAmount(transaction);
      }
      return money(balance, account.currency);
    };
    const accountsValue = activeAccounts.reduce(
      (total, account) => total + balanceOf(account),
      0,
    );

    const activeAssets = assets.filter((asset) => !asset.archived);
    const valuationsByAsset = new Map<string, Valuation[]>();
    for (const valuation of valuations) {
      const list = valuationsByAsset.get(valuation.assetId) ?? [];
      list.push(valuation);
      valuationsByAsset.set(valuation.assetId, list);
    }
    for (const list of valuationsByAsset.values()) {
      list.sort((first, second) => first.date.localeCompare(second.date));
    }

    const assetValueAt = (asset: Asset, end?: string): number => {
      const list = valuationsByAsset.get(asset.id) ?? [];
      if (list.length === 0) return 0;
      if (!end) {
        const latest = list[list.length - 1];
        return money(latest.value, latest.currency);
      }
      const upTo = list.filter((valuation) => valuation.date <= end);
      const chosen = upTo.length > 0 ? upTo[upTo.length - 1] : list[0];
      return money(chosen.value, chosen.currency);
    };

    const assetsValue = activeAssets.reduce(
      (total, asset) => total + assetValueAt(asset),
      0,
    );

    const assetsValueByMonth = months.map((month) => {
      const end = this.calculations.monthEnd(month);
      return {
        month,
        value: activeAssets.reduce(
          (total, asset) => total + assetValueAt(asset, end),
          0,
        ),
      };
    });

    const compositionMap = new Map<Asset["type"], number>();
    for (const asset of activeAssets) {
      compositionMap.set(
        asset.type,
        (compositionMap.get(asset.type) ?? 0) + assetValueAt(asset),
      );
    }
    const assetsComposition = [...compositionMap.entries()].map(
      ([type, value]) => ({ type, value }),
    );

    const staleMs = this.config.get("market", { infer: true }).quoteStaleMs;
    const now = Date.now();
    const derivedPositions = positions.map((position) => {
      const quote = quotes
        .filter(
          (item) =>
            item.symbol === position.symbol &&
            item.currency === position.currency,
        )
        .sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime())[0];
      const valuation = quote
        ? this.calculations.calculatePositionValue(
            position.quantity,
            position.avgCost,
            quote.price,
          )
        : null;
      return {
        position,
        quote,
        costBasis: valuation?.costBasis ?? position.quantity * position.avgCost,
        currentValue: valuation?.currentValue ?? null,
        profitLoss: valuation?.profitLoss ?? null,
        profitLossPct: valuation?.profitLossPct ?? null,
        isStale: quote ? now - quote.fetchedAt.getTime() > staleMs : false,
      };
    });

    const positionsValue = derivedPositions.reduce(
      (total, item) =>
        total + money(item.currentValue ?? 0, item.position.currency),
      0,
    );
    const positionsCost = derivedPositions.reduce(
      (total, item) => total + money(item.costBasis, item.position.currency),
      0,
    );
    const positionsProfit = positionsValue - positionsCost;

    const debtsValue = debts
      .filter((debt) => !debt.archived)
      .reduce((total, debt) => total + money(debt.balance, debt.currency), 0);

    const netWorth = assetsValue + positionsValue + accountsValue - debtsValue;

    const netWorthSeries = months.map((month) => {
      const date = this.calculations.monthEnd(month);
      const physicalAssets =
        assetsValueByMonth.find((item) => item.month === month)?.value ?? 0;
      const monthAccounts = activeAccounts.reduce(
        (total, account) => total + balanceOf(account, date),
        0,
      );
      const totalAssets = physicalAssets + positionsValue + monthAccounts;
      return {
        date,
        value: totalAssets - debtsValue,
        assets: totalAssets,
        debts: debtsValue,
      };
    });

    const seriesStart = netWorthSeries[0];
    const assetsStart = seriesStart?.assets ?? assetsValue;
    const accountsStart = activeAccounts.reduce(
      (total, account) => total + balanceOf(account, seriesStart?.date),
      0,
    );
    const physicalStart = assetsStart - positionsValue - accountsStart;

    const physicalByType = new Map(
      assetsComposition.map((item) => [item.type, item.value]),
    );
    const otherAssets = [...physicalByType.entries()]
      .filter(([type]) => type !== "property" && type !== "vehicle")
      .reduce((total, [, value]) => total + value, 0);
    const netWorthComposition = [
      {
        kind: "property" as const,
        label: "Propiedades",
        value: physicalByType.get("property") ?? 0,
      },
      {
        kind: "vehicle" as const,
        label: "Vehículos",
        value: physicalByType.get("vehicle") ?? 0,
      },
      { kind: "asset" as const, label: "Otros activos", value: otherAssets },
      {
        kind: "investment" as const,
        label: "Inversiones",
        value: positionsValue,
      },
      { kind: "account" as const, label: "Cuentas", value: accountsValue },
    ].filter((item) => item.value !== 0);

    const budgetAlerts = (
      await this.budgetsService.listBudgetAlerts(userId, to.slice(0, 7))
    ).map((budget) => ({
      budgetId: budget.id,
      categoryName: budget.category.name,
      consumedPct: budget.consumedPct,
      status: budget.status,
    }));

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
        assets: assetsValue,
        assetsDeltaPct: this.calculations.pctDelta(assetsValue, physicalStart),
        debts: debtsValue,
        debtsDeltaPct: seriesStart
          ? this.calculations.pctDelta(debtsValue, seriesStart.debts)
          : null,
        accounts: accountsValue,
        accountsDeltaPct: null,
        investmentsDeltaPct:
          positionsCost > 0 ? (positionsProfit / positionsCost) * 100 : null,
      },
      netWorthSeries,
      assetsValueByMonth,
      incomeExpenseByMonth,
      expensesByCategory,
      categoryChanges,
      assetsComposition,
      netWorthComposition,
      cashflow: {
        income: incomeSources,
        expenses: expensesByCategory.map(({ name, color, value }) => ({
          name,
          color,
          value,
        })),
        savings: Math.max(0, current.savings),
      },
      investments: {
        totalValue: positionsValue,
        totalCost: positionsCost,
        profitLoss: positionsProfit,
        profitLossPct:
          positionsCost > 0 ? (positionsProfit / positionsCost) * 100 : 0,
        staleQuotes: derivedPositions.filter((item) => item.isStale).length,
        positions: derivedPositions
          .map((item) => ({
            symbol: item.position.symbol,
            instrument: item.position.instrument,
            quantity: item.position.quantity,
            originalCurrency: item.position.currency,
            originalValue: item.currentValue ?? 0,
            originalCost: item.costBasis,
            originalProfitLoss: item.profitLoss,
            value: money(item.currentValue ?? 0, item.position.currency),
            profitLossPct: item.profitLossPct,
            isStale: item.isStale,
            quoteDate: item.quote?.fetchedAt.toISOString() ?? null,
          }))
          .sort((first, second) => second.value - first.value),
      },
      budgetAlerts,
    };
  }
}

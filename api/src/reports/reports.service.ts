import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { BudgetsService } from "../budgets/budgets.service";
import { Category } from "../categories/entities/category.entity";
import { DashboardService } from "../dashboard/dashboard.service";
import { DashboardQueryDto } from "../dashboard/dto/dashboard-query.dto";
import { FxService } from "../fx/fx.service";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";

export interface ReportSummary {
  from: string;
  to: string;
  currency: string;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
}

export interface ReportByCategoryRow {
  categoryId: string;
  name: string;
  type: "income" | "expense";
  value: number;
  pct: number;
}

export interface NetWorthPoint {
  date: string;
  netWorth: number;
}

export interface BudgetReportRow {
  budgetId: string;
  categoryName: string;
  limit: number;
  spent: number;
  consumedPct: number;
  status: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly dashboardService: DashboardService,
    private readonly budgetsService: BudgetsService,
    private readonly fxService: FxService,
  ) {}

  async summary(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<ReportSummary> {
    const dashboard = await this.dashboardService.getDashboard(userId, query);
    return {
      from: dashboard.period.from,
      to: dashboard.period.to,
      currency: dashboard.currency,
      income: dashboard.kpis.income,
      expenses: dashboard.kpis.expenses,
      savings: dashboard.kpis.savings,
      netWorth: dashboard.kpis.netWorth,
    };
  }

  async byCategory(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<ReportByCategoryRow[]> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const currency = (query.currency ?? user.baseCurrency).toUpperCase();
    const dashboard = await this.dashboardService.getDashboard(userId, query);
    const { from, to } = dashboard.period;

    const [transactions, categories] = await Promise.all([
      this.transactionsRepository.find({ where: { userId } }),
      this.categoriesRepository.find({
        where: [{ userId }, { userId: IsNull() }],
      }),
    ]);
    const nameById = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const convert = await this.fxService.getConverter();

    const totals = new Map<
      string,
      { type: "income" | "expense"; value: number }
    >();
    for (const transaction of transactions) {
      if (transaction.type === "transfer") continue;
      if (transaction.date < from || transaction.date > to) continue;
      const key = `${transaction.type}:${transaction.categoryId ?? "other"}`;
      const current = totals.get(key) ?? { type: transaction.type, value: 0 };
      current.value += convert(
        transaction.amount,
        transaction.currency,
        currency,
      );
      totals.set(key, current);
    }

    const expenseTotal = [...totals.values()]
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + item.value, 0);
    const incomeTotal = [...totals.values()]
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + item.value, 0);

    return [...totals.entries()]
      .map(([key, item]) => {
        const categoryId = key.split(":")[1];
        const base = item.type === "expense" ? expenseTotal : incomeTotal;
        return {
          categoryId,
          name:
            categoryId === "other"
              ? item.type === "income"
                ? "Otros ingresos"
                : "Sin categoría"
              : (nameById.get(categoryId) ?? "Sin categoría"),
          type: item.type,
          value: item.value,
          pct: base > 0 ? (item.value / base) * 100 : 0,
        };
      })
      .sort((first, second) => second.value - first.value);
  }

  async netWorth(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<NetWorthPoint[]> {
    const dashboard = await this.dashboardService.getDashboard(userId, query);
    return dashboard.netWorthSeries.map((point) => ({
      date: point.date,
      netWorth: point.value,
    }));
  }

  async budgets(userId: string, period?: string): Promise<BudgetReportRow[]> {
    const budgets = await this.budgetsService.listBudgets(userId, period);
    return budgets.map((budget) => ({
      budgetId: budget.id,
      categoryName: budget.category.name,
      limit: budget.limit,
      spent: budget.spent,
      consumedPct: budget.consumedPct,
      status: budget.status,
    }));
  }

  async investments(userId: string, query: DashboardQueryDto) {
    const dashboard = await this.dashboardService.getDashboard(userId, query);
    return dashboard.investments;
  }

  async exportCsv(
    userId: string,
    query: DashboardQueryDto,
    type: string,
  ): Promise<string> {
    if (type === "summary") {
      const summary = await this.summary(userId, query);
      const rows = [
        ["Campo", "Valor"],
        ["Desde", summary.from],
        ["Hasta", summary.to],
        ["Moneda", summary.currency],
        ["Ingresos", String(summary.income)],
        ["Gastos", String(summary.expenses)],
        ["Ahorro", String(summary.savings)],
        ["Patrimonio neto", String(summary.netWorth)],
      ];
      return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    }

    const filters: DashboardQueryDto = query;
    const transactions = await this.transactionsRepository.find({
      where: { userId },
      order: { date: "DESC", createdAt: "DESC" },
    });
    const rows = [
      [
        "Fecha",
        "Tipo",
        "Descripcion",
        "Monto",
        "Moneda",
        "Cuenta",
        "Cuenta destino",
        "Categoria",
        "Notas",
      ],
      ...transactions
        .filter(
          (transaction) =>
            (!filters.from || transaction.date >= filters.from) &&
            (!filters.to || transaction.date <= filters.to),
        )
        .map((transaction) => [
          transaction.date,
          transaction.type,
          transaction.description,
          String(transaction.amount),
          transaction.currency,
          transaction.accountId,
          transaction.transferAccountId ?? "",
          transaction.categoryId ?? "",
          transaction.notes ?? "",
        ]),
    ];
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  }
}

const escapeCsv = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

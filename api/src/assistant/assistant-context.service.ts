import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { Budget } from "../budgets/entities/budget.entity";
import { Category } from "../categories/entities/category.entity";
import { Debt } from "../debts/entities/debt.entity";
import { Position } from "../positions/entities/position.entity";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";
import { AssistantMessageDto } from "./dto/assistant-message.dto";

export interface AssistantContext {
  period: { from: string; to: string };
  currency: string;
  sources: string[];
  summary: string;
}

const DAY_MS = 86_400_000;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class AssistantContextService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
    @InjectRepository(Valuation)
    private readonly valuationsRepository: Repository<Valuation>,
    @InjectRepository(Debt)
    private readonly debtsRepository: Repository<Debt>,
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async build(
    userId: string,
    dto: AssistantMessageDto,
  ): Promise<AssistantContext> {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const to = dto.period?.to ?? toIsoDate(new Date());
    const from =
      dto.period?.from ??
      toIsoDate(new Date(new Date(to).getTime() - 29 * DAY_MS));
    const currency = dto.currency ?? user.baseCurrency;
    const sources = new Set<string>(["transactions"]);

    const transactions = await this.transactionsRepository.find({
      where: { userId },
    });
    const categories = await this.categoriesRepository.find();
    const categoryName = (id: string | null): string =>
      categories.find((category) => category.id === id)?.name ??
      "Sin categoría";

    const inPeriod = transactions.filter(
      (transaction) => transaction.date >= from && transaction.date <= to,
    );
    const income = inPeriod
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = inPeriod
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expenseByCategory = new Map<string, number>();
    for (const transaction of inPeriod) {
      if (transaction.type !== "expense" || !transaction.categoryId) continue;
      expenseByCategory.set(
        transaction.categoryId,
        (expenseByCategory.get(transaction.categoryId) ?? 0) +
          transaction.amount,
      );
    }
    const topCategories = [...expenseByCategory.entries()]
      .map(([categoryId, value]) => ({
        name: categoryName(categoryId),
        value,
      }))
      .sort((first, second) => second.value - first.value)
      .slice(0, 5);

    const month = to.slice(0, 7);
    const budgets = await this.budgetsRepository.find({
      where: { userId, period: `${month}-01` },
    });
    if (budgets.length > 0) sources.add("budgets");
    const monthExpenses = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.date.slice(0, 7) === month,
      )
      .reduce((total, transaction) => {
        return total + transaction.amount;
      }, 0);
    const budgetSummary = budgets.slice(0, 6).map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.categoryId === budget.categoryId &&
            transaction.date.slice(0, 7) === month,
        )
        .reduce((total, transaction) => total + transaction.amount, 0);
      const consumedPct =
        budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
      return {
        category: categoryName(budget.categoryId),
        limit: budget.limit,
        spent,
        consumedPct,
      };
    });

    const accounts = await this.accountsRepository.find({ where: { userId } });
    const cash = accounts
      .filter((account) => !account.archived)
      .reduce((total, account) => total + account.initialBalance, 0);

    const assets = await this.assetsRepository.find({ where: { userId } });
    const assetIds = assets.map((asset) => asset.id);
    const assetsValue = (
      assetIds.length > 0
        ? await this.valuationsRepository.find({
            where: { assetId: In(assetIds) },
            order: { date: "DESC" },
          })
        : []
    ).reduce((total, valuation, index, list) => {
      const isLatest =
        list.findIndex((item) => item.assetId === valuation.assetId) === index;
      return isLatest ? total + valuation.value : total;
    }, 0);
    if (assets.length > 0) sources.add("assets");

    const debts = await this.debtsRepository.find({ where: { userId } });
    const debtTotal = debts
      .filter((debt) => !debt.archived)
      .reduce((total, debt) => total + debt.balance, 0);
    if (debts.length > 0) sources.add("debts");

    const positions = await this.positionsRepository.find({
      where: { userId },
    });
    const positionsCost = positions
      .filter((position) => !position.archived)
      .reduce(
        (total, position) => total + position.quantity * position.avgCost,
        0,
      );
    if (positions.length > 0) sources.add("positions");

    const netWorth = assetsValue + positionsCost + cash - debtTotal;

    const summary = [
      `Período analizado: ${from} a ${to} (moneda ${currency}).`,
      `Ingresos del período: ${income}.`,
      `Gastos del período: ${expenses}.`,
      `Ahorro (ingresos - gastos): ${income - expenses}.`,
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

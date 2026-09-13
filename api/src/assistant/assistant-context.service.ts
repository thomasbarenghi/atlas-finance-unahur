import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { Budget } from "../budgets/entities/budget.entity";
import { Category } from "../categories/entities/category.entity";
import { Debt } from "../debts/entities/debt.entity";
import { Position } from "../positions/entities/position.entity";
import { CalculationsService } from "../shared/calculations/calculations.service";
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
    private readonly calculations: CalculationsService,
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
    if (from > to) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El período es inválido",
      );
    }
    const currency = dto.currency ?? user.baseCurrency;
    const sources = new Set<string>(["transactions"]);

    const transactions = await this.transactionsRepository.find({
      where: { userId },
    });
    const categories = await this.categoriesRepository.find({
      where: [{ userId }, { userId: IsNull() }],
    });
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
    const monthExpensesByCategory =
      this.calculations.calculateExpensesByCategory(
        transactions,
        `${month}-01`,
        `${month}-31`,
      );
    const budgets = await this.budgetsRepository.find({
      where: { userId, period: `${month}-01` },
    });
    if (budgets.length > 0) sources.add("budgets");
    const budgetSummary = budgets.slice(0, 6).map((budget) => {
      const spent = monthExpensesByCategory.get(budget.categoryId) ?? 0;
      const consumption = this.calculations.calculateBudgetConsumption(
        budget.limit,
        spent,
      );
      return {
        category: categoryName(budget.categoryId),
        limit: consumption.limit,
        spent: consumption.spent,
        consumedPct: Math.round(consumption.consumedPct),
      };
    });

    const accounts = await this.accountsRepository.find({ where: { userId } });
    const cash = this.calculations.calculateCashBalance(accounts, transactions);

    const assets = await this.assetsRepository.find({ where: { userId } });
    const assetIds = assets.map((asset) => asset.id);
    const valuations =
      assetIds.length > 0
        ? await this.valuationsRepository.find({
            where: { assetId: In(assetIds) },
            order: { date: "DESC" },
          })
        : [];
    const assetsValue = this.calculations.getLatestValuationsTotal(valuations);
    if (assets.length > 0) sources.add("assets");

    const debts = await this.debtsRepository.find({ where: { userId } });
    const debtTotal = debts
      .filter((debt) => !debt.archived)
      .reduce((total, debt) => total + debt.balance, 0);
    if (debts.length > 0) sources.add("debts");

    const positions = await this.positionsRepository.find({
      where: { userId },
    });
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

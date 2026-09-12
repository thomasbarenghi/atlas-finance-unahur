import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, IsNull, Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Category } from "../categories/entities/category.entity";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { Transaction } from "../transactions/entities/transaction.entity";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import { CopyBudgetsDto } from "./dto/copy-budgets.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { Budget } from "./entities/budget.entity";

const monthOf = (period: string): string => period.slice(0, 7);
const normalizePeriod = (period: string): string => `${period.slice(0, 7)}-01`;

const monthBounds = (month: string): { from: string; to: string } => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
};

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly calculationsService: CalculationsService,
  ) {}

  async listBudgets(
    userId: string,
    period?: string,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetsRepository.find({
      where: { userId },
      order: { period: "DESC" },
    });
    const scoped = period
      ? this.projectForMonth(budgets, monthOf(period))
      : budgets;
    return this.derive(userId, scoped);
  }

  async listBudgetAlerts(
    userId: string,
    month: string,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetsRepository.find({ where: { userId } });
    const derived = await this.derive(
      userId,
      this.projectForMonth(budgets, month),
    );
    return derived.filter((budget) => budget.status !== "available");
  }

  async createBudget(
    userId: string,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.assertCategory(userId, dto.categoryId);
    const period = normalizePeriod(dto.period);
    const existing = await this.budgetsRepository.findOneBy({
      userId,
      categoryId: dto.categoryId,
      period,
    });
    if (existing) {
      throw new ApiException(
        ErrorCode.DUPLICATE_BUDGET,
        HttpStatus.CONFLICT,
        "Ya existe un presupuesto para ese período",
      );
    }

    const budget = this.budgetsRepository.create({
      userId,
      categoryId: dto.categoryId,
      period,
      limit: dto.limit,
      currency: dto.currency.toUpperCase(),
      recurring: dto.recurring ?? false,
    });
    const saved = await this.budgetsRepository.save(budget);
    const [response] = await this.derive(userId, [saved]);
    return response;
  }

  async updateBudget(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.findOwnedBudget(userId, id);
    if (dto.limit !== undefined) budget.limit = dto.limit;
    if (dto.currency !== undefined)
      budget.currency = dto.currency.toUpperCase();
    if (dto.recurring !== undefined) budget.recurring = dto.recurring;

    const saved = await this.budgetsRepository.save(budget);
    const [response] = await this.derive(userId, [saved]);
    return response;
  }

  async deleteBudget(userId: string, id: string): Promise<void> {
    const result = await this.budgetsRepository.delete({ id, userId });
    if (!result.affected) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El presupuesto no existe",
      );
    }
  }

  async copyPreviousBudgets(
    userId: string,
    dto: CopyBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    const target = monthOf(dto.period);
    const source = dto.sourcePeriod
      ? monthOf(dto.sourcePeriod)
      : this.previousMonth(target);

    const budgets = await this.budgetsRepository.find({ where: { userId } });
    const originals = budgets.filter(
      (budget) => monthOf(budget.period) === source,
    );
    const existingCategories = new Set(
      budgets
        .filter((budget) => monthOf(budget.period) === target)
        .map((budget) => budget.categoryId),
    );

    const copies: Budget[] = [];
    for (const original of originals) {
      if (existingCategories.has(original.categoryId)) continue;
      copies.push(
        this.budgetsRepository.create({
          userId,
          categoryId: original.categoryId,
          period: `${target}-01`,
          limit: original.limit,
          currency: original.currency,
          recurring: false,
        }),
      );
    }

    if (copies.length === 0) return [];
    const saved = await this.budgetsRepository.save(copies);
    return this.derive(userId, saved);
  }

  private async derive(
    userId: string,
    budgets: Budget[],
  ): Promise<BudgetResponseDto[]> {
    if (budgets.length === 0) return [];

    const categories = await this.categoriesRepository.find({
      where: [{ userId }, { userId: IsNull() }],
    });
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    const months = [
      ...new Set(budgets.map((budget) => monthOf(budget.period))),
    ];
    const spentByCategoryMonth = new Map<string, number>();
    for (const month of months) {
      const { from, to } = monthBounds(month);
      const transactions = await this.transactionsRepository.find({
        where: {
          userId,
          type: "expense",
          date: Between(from, to),
          categoryId: In(budgets.map((budget) => budget.categoryId)),
        },
        select: ["categoryId", "amount", "date"],
      });
      for (const transaction of transactions) {
        if (!transaction.categoryId) continue;
        const key = `${transaction.categoryId}:${month}`;
        spentByCategoryMonth.set(
          key,
          (spentByCategoryMonth.get(key) ?? 0) + transaction.amount,
        );
      }
    }

    return budgets.map((budget) => {
      const category = categoryById.get(budget.categoryId);
      const month = monthOf(budget.period);
      const spent =
        spentByCategoryMonth.get(`${budget.categoryId}:${month}`) ?? 0;
      const consumption = this.calculationsService.calculateBudgetConsumption(
        budget.limit,
        spent,
      );
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        category: {
          id: budget.categoryId,
          name: category?.name ?? "Sin categoría",
          color: category?.color ?? "#64748b",
        },
        period: budget.period,
        limit: budget.limit,
        currency: budget.currency,
        recurring: budget.recurring,
        spent: consumption.spent,
        available: consumption.available,
        consumedPct: consumption.consumedPct,
        status: consumption.status,
      };
    });
  }

  private projectForMonth(budgets: Budget[], month: string): Budget[] {
    const explicit = budgets.filter(
      (budget) => monthOf(budget.period) === month,
    );
    const explicitCategories = new Set(
      explicit.map((budget) => budget.categoryId),
    );
    const latestRecurring = new Map<string, Budget>();

    for (const budget of budgets) {
      if (!budget.recurring) continue;
      if (monthOf(budget.period) > month) continue;
      if (explicitCategories.has(budget.categoryId)) continue;
      const current = latestRecurring.get(budget.categoryId);
      if (!current || monthOf(budget.period) > monthOf(current.period)) {
        latestRecurring.set(budget.categoryId, budget);
      }
    }

    const projected = [...latestRecurring.values()].map((template) => ({
      ...template,
      period: `${month}-01`,
    }));
    return [...explicit, ...projected];
  }

  private previousMonth(month: string): string {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 2, 1));
    return date.toISOString().slice(0, 7);
  }

  private async assertCategory(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.categoriesRepository.findOneBy({
      id: categoryId,
    });
    if (!category || (category.userId !== userId && category.userId !== null)) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La categoría no existe",
      );
    }
  }

  private async findOwnedBudget(userId: string, id: string): Promise<Budget> {
    const budget = await this.budgetsRepository.findOneBy({ id, userId });
    if (!budget) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El presupuesto no existe",
      );
    }
    return budget;
  }
}

import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CurrencyService } from "../shared/currency/currency.service";
import { CopyBudgetsDto } from "./dto/copy-budgets.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { Budget } from "./entities/budget.entity";

export const monthOf = (period: string): string => period.slice(0, 7);
export const normalizePeriod = (period: string): string =>
  `${period.slice(0, 7)}-01`;

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    private readonly currency: CurrencyService,
  ) {}

  async listOwnedBudgets(userId: string): Promise<Budget[]> {
    return this.budgetsRepository.find({
      where: { userId },
      order: { period: "DESC" },
    });
  }

  async createBudget(userId: string, dto: CreateBudgetDto): Promise<Budget> {
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
      currency: this.currency.assertSupported(dto.currency),
      recurring: dto.recurring ?? false,
    });
    return this.budgetsRepository.save(budget);
  }

  async updateBudget(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findOwnedBudget(userId, id);
    if (dto.limit !== undefined) budget.limit = dto.limit;
    if (dto.currency !== undefined)
      budget.currency = this.currency.assertSupported(dto.currency);
    if (dto.recurring !== undefined) budget.recurring = dto.recurring;

    return this.budgetsRepository.save(budget);
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
  ): Promise<Budget[]> {
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
    return this.budgetsRepository.save(copies);
  }

  projectForMonth(budgets: Budget[], month: string): Budget[] {
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

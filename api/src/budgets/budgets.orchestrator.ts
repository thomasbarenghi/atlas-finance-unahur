import { HttpStatus, Injectable } from "@nestjs/common";
import { CategoriesService } from "../categories/categories.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { TransactionsService } from "../transactions/transactions.service";
import { BudgetsService, monthOf } from "./budgets.service";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import { CopyBudgetsDto } from "./dto/copy-budgets.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { Budget } from "./entities/budget.entity";

/**
 * Composite use cases of the budgets domain. It coordinates categories (name,
 * colour and "expense-only" validation) and transactions (consumption of the
 * period, FR-PRE-004) around the budgets service, and returns response DTOs.
 */
@Injectable()
export class BudgetsOrchestrator {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly categoriesService: CategoriesService,
    private readonly transactionsService: TransactionsService,
    private readonly calculationsService: CalculationsService,
  ) {}

  async listBudgets(
    userId: string,
    period?: string,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetsService.listOwnedBudgets(userId);
    const scoped = period
      ? this.budgetsService.projectForMonth(budgets, monthOf(period))
      : budgets;
    return this.derive(userId, scoped);
  }

  async listBudgetAlerts(
    userId: string,
    month: string,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetsService.listOwnedBudgets(userId);
    const derived = await this.derive(
      userId,
      this.budgetsService.projectForMonth(budgets, month),
    );
    return derived.filter((budget) => budget.status !== "available");
  }

  async createBudget(
    userId: string,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    await this.assertExpenseCategory(userId, dto.categoryId);
    const budget = await this.budgetsService.createBudget(userId, dto);
    const [response] = await this.derive(userId, [budget]);
    return response;
  }

  async updateBudget(
    userId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsService.updateBudget(userId, id, dto);
    const [response] = await this.derive(userId, [budget]);
    return response;
  }

  deleteBudget(userId: string, id: string): Promise<void> {
    return this.budgetsService.deleteBudget(userId, id);
  }

  async copyPreviousBudgets(
    userId: string,
    dto: CopyBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    const copies = await this.budgetsService.copyPreviousBudgets(userId, dto);
    return this.derive(userId, copies);
  }

  private async derive(
    userId: string,
    budgets: Budget[],
  ): Promise<BudgetResponseDto[]> {
    if (budgets.length === 0) return [];

    const categories = await this.categoriesService.listCategories(userId);
    const categoryById = new Map(
      categories.map((category) => [category.id, category]),
    );

    const months = [
      ...new Set(budgets.map((budget) => monthOf(budget.period))),
    ];
    const spentByCategoryMonth =
      await this.transactionsService.expensesByCategoryMonth(
        userId,
        months,
        budgets.map((budget) => budget.categoryId),
      );

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

  private async assertExpenseCategory(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.categoriesService.assertCategoryUsable(
      userId,
      categoryId,
    );
    if (category.type !== "expense") {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "El presupuesto debe ser sobre una categoría de gasto",
        { categoryId: ["Debe ser una categoría de gasto"] },
      );
    }
  }
}

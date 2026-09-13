import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../../accounts/accounts.service";
import { AssetsService } from "../../assets/assets.service";
import { BudgetsService } from "../../budgets/budgets.service";
import { CategoriesService } from "../../categories/categories.service";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import type { CategoryType } from "../../common/types/financial-enums";
import { DebtsService } from "../../debts/debts.service";
import { GoalsService } from "../../goals/goals.service";
import { PositionsService } from "../../positions/positions.service";
import { isUuid, requireString } from "./tool-input";

interface Identified {
  id: string;
}

export const normalizeReference = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

@Injectable()
export class ReferenceResolver {
  constructor(
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
    private readonly assets: AssetsService,
    private readonly debts: DebtsService,
    private readonly positions: PositionsService,
    private readonly goals: GoalsService,
    private readonly budgets: BudgetsService,
  ) {}

  async resolveAccountId(userId: string, reference: unknown): Promise<string> {
    const accounts = await this.accounts.listAccounts(userId);
    return this.resolveReference(accounts, reference, "cuenta", (item) => [
      item.name,
    ]);
  }

  async resolveCategoryId(
    userId: string,
    reference: unknown,
    type?: CategoryType,
  ): Promise<string> {
    const categories = await this.categories.listCategories(userId);
    const scoped = type
      ? categories.filter((category) => category.type === type)
      : categories;
    return this.resolveReference(
      scoped,
      reference,
      "categoría",
      (item) => [item.name],
      type
        ? ` (debe ser de tipo ${type === "income" ? "ingreso" : "gasto"})`
        : undefined,
    );
  }

  async resolveAssetId(userId: string, reference: unknown): Promise<string> {
    const assets = await this.assets.listAssets(userId);
    return this.resolveReference(assets, reference, "activo", (item) => [
      item.name,
    ]);
  }

  async resolveDebtId(userId: string, reference: unknown): Promise<string> {
    const debts = await this.debts.listDebts(userId);
    return this.resolveReference(debts, reference, "deuda", (item) => [
      item.name,
    ]);
  }

  async resolvePositionId(userId: string, reference: unknown): Promise<string> {
    const positions = await this.positions.listPositions(userId);
    return this.resolveReference(positions, reference, "inversión", (item) => [
      item.symbol,
      item.instrument,
    ]);
  }

  async resolveGoalId(userId: string, reference: unknown): Promise<string> {
    const goals = await this.goals.listGoals(userId);
    return this.resolveReference(goals, reference, "meta", (item) => [
      item.name,
    ]);
  }

  async resolveBudgetId(
    userId: string,
    reference: unknown,
    period?: string,
  ): Promise<string> {
    const budgets = await this.budgets.listBudgets(userId, period);
    return this.resolveReference(budgets, reference, "presupuesto", (item) => [
      item.category.name,
      `${item.category.name} ${item.period.slice(0, 7)}`,
    ]);
  }

  private resolveReference<T extends Identified>(
    items: T[],
    reference: unknown,
    entityLabel: string,
    namesOf: (item: T) => string[],
    notFoundHint?: string,
  ): string {
    const article =
      entityLabel === "activo" || entityLabel === "presupuesto" ? "el" : "la";
    const ref = requireString(
      reference,
      `Falta indicar ${article} ${entityLabel}.`,
    );

    if (isUuid(ref)) {
      const byId = items.find((item) => item.id === ref);
      if (byId) return byId.id;
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `La ${entityLabel} no existe`,
      );
    }

    const target = normalizeReference(ref);
    const exact = items.filter((item) =>
      namesOf(item).some((name) => normalizeReference(name) === target),
    );
    const matches =
      exact.length > 0
        ? exact
        : items.filter((item) =>
            namesOf(item).some((name) =>
              normalizeReference(name).includes(target),
            ),
          );

    if (matches.length === 1) return matches[0].id;
    if (matches.length === 0) {
      throw new ApiException(
        ErrorCode.REFERENCE_PENDING,
        HttpStatus.CONFLICT,
        `No encontré ninguna ${entityLabel} que coincida con "${ref}"${notFoundHint ?? ""}.`,
      );
    }

    const options = matches
      .map((item) => namesOf(item)[0])
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(", ");
    throw new ApiException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      `Hay varias ${entityLabel} que coinciden con "${ref}": ${options}. Indicá cuál con más precisión.`,
    );
  }
}

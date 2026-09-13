import { HttpStatus, Injectable } from "@nestjs/common";
import { CreateBudgetDto } from "../../../budgets/dto/create-budget.dto";
import { CopyBudgetsDto } from "../../../budgets/dto/copy-budgets.dto";
import { UpdateBudgetDto } from "../../../budgets/dto/update-budget.dto";
import { BudgetsService } from "../../../budgets/budgets.service";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import { UsersService } from "../../../users/users.service";
import { ReferenceResolver } from "../reference-resolver.service";
import { jsonSchema, optionalString, validateToolArgs } from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const budgetEntity = (budget: {
  id: string;
  category: { name: string };
  currency: string;
}): AssistantActionEntity => ({
  id: budget.id,
  name: budget.category.name,
  currency: budget.currency,
});

@Injectable()
export class BudgetTools {
  constructor(
    private readonly budgets: BudgetsService,
    private readonly users: UsersService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listBudgets",
        title: "Listar presupuestos",
        description:
          "Lista los presupuestos del usuario. Si indicás un período (YYYY-MM) proyecta los recurrentes vigentes.",
        classification: "read",
        parameters: jsonSchema({
          period: {
            type: "string",
            description: "Período YYYY-MM o YYYY-MM-DD.",
          },
        }),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const period = optionalString(args.period);
          const budgets = await this.budgets.listBudgets(userId, period);
          return {
            ok: true,
            summary: `${budgets.length} presupuesto(s).`,
            data: { budgets },
          };
        },
      },
      {
        name: "createBudget",
        title: "Crear presupuesto",
        description:
          "Crea un presupuesto mensual para una categoría de gasto. Si no indicás moneda, se usa la moneda base del usuario.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            category: {
              type: "string",
              description: "Categoría (id o nombre).",
            },
            period: {
              type: "string",
              description: "Período YYYY-MM o YYYY-MM-DD.",
            },
            limit: { type: "number", description: "Límite mensual (>= 0)." },
            currency: { type: "string" },
            recurring: { type: "boolean", description: "Renovar cada mes." },
          },
          ["category", "period", "limit"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const categoryId = await this.resolver.resolveCategoryId(
            userId,
            args.category,
          );
          const user = await this.users.getById(userId);
          const dto = await validateToolArgs(CreateBudgetDto, {
            categoryId,
            period: args.period,
            limit: args.limit,
            currency: optionalString(args.currency) ?? user.baseCurrency,
            recurring: args.recurring,
          });
          const category = await this.categoryName(userId, categoryId);
          return {
            args: dto as unknown as Record<string, unknown>,
            summary: `Crear presupuesto de ${category} por ${dto.limit} ${dto.currency}`,
            preview: {
              title: "Crear presupuesto",
              summary: `Presupuesto para ${category} en ${dto.period.slice(0, 7)}.`,
              fields: [
                { label: "Categoría", value: category },
                { label: "Período", value: dto.period.slice(0, 7) },
                { label: "Límite", value: `${dto.limit} ${dto.currency}` },
                {
                  label: "Renovación",
                  value: dto.recurring ? "Automática" : "Solo este mes",
                },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateBudgetDto, args);
          const budget = await this.budgets.createBudget(userId, dto);
          return {
            ok: true,
            summary: `Creé el presupuesto de ${budget.category.name} por ${budget.limit} ${budget.currency}.`,
            data: { budget },
            entity: budgetEntity(budget),
          };
        },
      },
      {
        name: "updateBudget",
        title: "Editar presupuesto",
        description:
          "Edita el límite, la moneda o la renovación de un presupuesto. Acepta id o nombre de categoría (con período para desambiguar).",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            budgetId: {
              type: "string",
              description: "Id (uuid) o nombre de categoría del presupuesto.",
            },
            period: {
              type: "string",
              description: "Período para desambiguar por categoría.",
            },
            limit: { type: "number" },
            currency: { type: "string" },
            recurring: { type: "boolean" },
          },
          ["budgetId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveBudgetId(
            userId,
            args.budgetId,
            optionalString(args.period),
          );
          const dto = await this.changes(args);
          return {
            args: { budgetId: id, ...dto },
            summary: `Editar el presupuesto ${id}`,
            preview: {
              title: "Editar presupuesto",
              summary: "Se actualizará el presupuesto.",
              fields: [
                { label: "Presupuesto", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveBudgetId(
            userId,
            args.budgetId,
            optionalString(args.period),
          );
          const dto = await this.changes(args);
          const budget = await this.budgets.updateBudget(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé el presupuesto de ${budget.category.name}.`,
            data: { budget },
            entity: budgetEntity(budget),
          };
        },
      },
      {
        name: "deleteBudget",
        title: "Eliminar presupuesto",
        description:
          "Elimina un presupuesto. Acepta id o nombre de categoría (con período para desambiguar). Es una acción destructiva.",
        classification: "destructive",
        parameters: jsonSchema(
          {
            budgetId: {
              type: "string",
              description: "Id (uuid) o nombre de categoría del presupuesto.",
            },
            period: {
              type: "string",
              description: "Período para desambiguar.",
            },
          },
          ["budgetId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveBudgetId(
            userId,
            args.budgetId,
            optionalString(args.period),
          );
          return {
            args: { budgetId: id },
            summary: `Eliminar el presupuesto ${await this.label(userId, id)}`,
            preview: {
              title: "Eliminar presupuesto",
              summary: "Se eliminará el presupuesto seleccionado.",
              fields: [
                { label: "Presupuesto", value: await this.label(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveBudgetId(
            userId,
            args.budgetId,
            optionalString(args.period),
          );
          await this.budgets.deleteBudget(userId, id);
          return {
            ok: true,
            summary: "Eliminé el presupuesto.",
            data: { id },
          };
        },
      },
      {
        name: "copyPreviousBudgets",
        title: "Copiar presupuestos",
        description:
          "Copia los presupuestos del mes indicado (o del mes anterior) a un período destino.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            period: { type: "string", description: "Período destino YYYY-MM." },
            sourcePeriod: {
              type: "string",
              description: "Período origen YYYY-MM.",
            },
          },
          ["period"],
        ),
        prepare: async (_userId, args): Promise<PreparedAction> => {
          const dto = await validateToolArgs(CopyBudgetsDto, args);
          return {
            args: dto as unknown as Record<string, unknown>,
            summary: `Copiar presupuestos a ${dto.period.slice(0, 7)}`,
            preview: {
              title: "Copiar presupuestos",
              summary: `Se copiarán los presupuestos a ${dto.period.slice(0, 7)}.`,
              fields: [
                { label: "Destino", value: dto.period.slice(0, 7) },
                {
                  label: "Origen",
                  value: dto.sourcePeriod
                    ? dto.sourcePeriod.slice(0, 7)
                    : "Mes anterior",
                },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CopyBudgetsDto, args);
          const budgets = await this.budgets.copyPreviousBudgets(userId, dto);
          return {
            ok: true,
            summary: budgets.length
              ? `Copié ${budgets.length} presupuesto(s).`
              : "No había presupuestos para copiar.",
            data: { budgets },
          };
        },
      },
    ];
  }

  private async changes(
    args: Record<string, unknown>,
  ): Promise<UpdateBudgetDto> {
    const candidate = {
      limit: args.limit,
      currency: optionalString(args.currency),
      recurring: args.recurring,
    };
    const defined = Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para el presupuesto.",
      );
    }
    return validateToolArgs(UpdateBudgetDto, defined);
  }

  private async label(userId: string, id: string): Promise<string> {
    const budgets = await this.budgets.listBudgets(userId);
    const budget = budgets.find((item) => item.id === id);
    return budget
      ? `${budget.category.name} (${budget.period.slice(0, 7)})`
      : id;
  }

  private async categoryName(userId: string, id: string): Promise<string> {
    const budgets = await this.budgets.listBudgets(userId);
    return budgets.find((item) => item.categoryId === id)?.category.name ?? id;
  }
}

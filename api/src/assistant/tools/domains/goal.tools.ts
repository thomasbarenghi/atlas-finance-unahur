import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import { ContributeGoalDto } from "../../../goals/dto/contribute-goal.dto";
import { CreateGoalDto } from "../../../goals/dto/create-goal.dto";
import { UpdateGoalDto } from "../../../goals/dto/update-goal.dto";
import { GoalsOrchestrator } from "../../../goals/goals.orchestrator";
import { GoalsService } from "../../../goals/goals.service";
import { UsersService } from "../../../users/users.service";
import { ReferenceResolver } from "../reference-resolver.service";
import { jsonSchema, optionalString, validateToolArgs } from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const goalEntity = (goal: {
  id: string;
  name: string;
  currency: string;
}): AssistantActionEntity => ({
  id: goal.id,
  name: goal.name,
  currency: goal.currency,
});

const isUnset = (value: unknown): boolean =>
  value === null ||
  (typeof value === "string" &&
    ["", "none", "ninguno", "ninguna", "null"].includes(
      value.trim().toLowerCase(),
    ));

@Injectable()
export class GoalTools {
  constructor(
    private readonly goals: GoalsService,
    private readonly orchestrator: GoalsOrchestrator,
    private readonly users: UsersService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listGoals",
        title: "Listar metas",
        description:
          "Lista las metas de ahorro del usuario con acumulado, objetivo, progreso, estado y cuenta origen.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const goals = await this.goals.listGoals(userId);
          return {
            ok: true,
            summary: `${goals.length} meta(s).`,
            data: { goals },
          };
        },
      },
      {
        name: "createGoal",
        title: "Crear meta",
        description:
          "Crea una meta de ahorro. Si no indicás moneda, se usa la moneda base del usuario.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            name: { type: "string" },
            targetAmount: {
              type: "number",
              description: "Monto objetivo (>= 0).",
            },
            savedAmount: { type: "number", description: "Monto acumulado." },
            currency: { type: "string" },
            targetDate: {
              type: "string",
              description: "Fecha objetivo YYYY-MM-DD.",
            },
            sourceAccount: {
              type: "string",
              description: "Cuenta origen donde vive el dinero (opcional).",
            },
          },
          ["name", "targetAmount"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const user = await this.users.getById(userId);
          const sourceAccountId =
            args.sourceAccount === undefined || args.sourceAccount === null
              ? null
              : await this.resolver.resolveAccountId(
                  userId,
                  args.sourceAccount,
                );
          const dto = await validateToolArgs(CreateGoalDto, {
            name: args.name,
            targetAmount: args.targetAmount,
            savedAmount: args.savedAmount,
            currency: optionalString(args.currency) ?? user.baseCurrency,
            targetDate: isUnset(args.targetDate)
              ? null
              : optionalString(args.targetDate),
            sourceAccountId,
          });
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.name,
            summary: `Crear la meta "${dto.name}" por ${dto.targetAmount} ${dto.currency}`,
            preview: {
              title: "Crear meta",
              summary: `Se creará la meta "${dto.name}".`,
              fields: [
                { label: "Nombre", value: dto.name },
                {
                  label: "Objetivo",
                  value: `${dto.targetAmount} ${dto.currency}`,
                },
                ...(dto.savedAmount
                  ? [{ label: "Acumulado", value: String(dto.savedAmount) }]
                  : []),
                ...(dto.targetDate
                  ? [{ label: "Fecha objetivo", value: dto.targetDate }]
                  : []),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateGoalDto, args);
          const goal = await this.orchestrator.createGoal(userId, dto);
          return {
            ok: true,
            summary: `Creé la meta "${goal.name}".`,
            data: { goal },
            entity: goalEntity(goal),
          };
        },
      },
      {
        name: "contributeToGoal",
        title: "Aportar a meta",
        description:
          "Suma un aporte al acumulado de una meta existente (no sobrescribe). Usala cuando el usuario diga que agrega o suma dinero a la meta.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            goal: { type: "string", description: "Meta (id o nombre)." },
            amount: {
              type: "number",
              description: "Monto a sumar al acumulado (mayor a 0).",
            },
          },
          ["goal", "amount"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveGoalId(userId, args.goal);
          const amount = await validateToolArgs(ContributeGoalDto, {
            amount: args.amount,
          });
          return {
            args: { goal: id, ...amount },
            summary: `Aportar ${amount.amount} a la meta ${await this.label(userId, id)}`,
            preview: {
              title: "Aportar a meta",
              summary: "Se sumará el monto al acumulado de la meta.",
              fields: [
                { label: "Meta", value: await this.label(userId, id) },
                { label: "Aporte", value: String(amount.amount) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { goal, ...rest } = args;
          const id = await this.resolver.resolveGoalId(userId, goal);
          const amount = await validateToolArgs(ContributeGoalDto, rest);
          const updated = await this.goals.contributeToGoal(
            userId,
            id,
            amount.amount,
          );
          return {
            ok: true,
            summary: `Aporté ${amount.amount} a "${updated.name}"; acumula ${updated.savedAmount}.`,
            data: { goal: updated },
            entity: goalEntity(updated),
          };
        },
      },
      {
        name: "updateGoal",
        title: "Editar meta",
        description:
          "Edita una meta o registra un aporte actualizando savedAmount. Para quitar la fecha objetivo o la cuenta origen, pasalas vacías.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            goal: { type: "string", description: "Meta (id o nombre)." },
            name: { type: "string" },
            targetAmount: { type: "number" },
            savedAmount: { type: "number", description: "Aporte acumulado." },
            currency: { type: "string" },
            targetDate: {
              type: "string",
              description: "Fecha objetivo o vacío.",
            },
            sourceAccount: {
              type: "string",
              description: "Cuenta origen o vacío.",
            },
          },
          ["goal"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { goal, ...rest } = args;
          const id = await this.resolver.resolveGoalId(userId, goal);
          const dto = await this.changes(userId, rest);
          return {
            args: { goal, ...dto },
            summary: `Editar la meta ${id}`,
            preview: {
              title: "Editar meta",
              summary: "Se actualizará la meta.",
              fields: [
                { label: "Meta", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { goal, ...rest } = args;
          const id = await this.resolver.resolveGoalId(userId, goal);
          const dto = await validateToolArgs(UpdateGoalDto, rest);
          const updated = await this.orchestrator.updateGoal(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé la meta "${updated.name}".`,
            data: { goal: updated },
            entity: goalEntity(updated),
          };
        },
      },
      {
        name: "archiveGoal",
        title: "Archivar meta",
        description: "Archiva una meta (id o nombre).",
        classification: "sensitive",
        parameters: jsonSchema(
          { goal: { type: "string", description: "Meta (id o nombre)." } },
          ["goal"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveGoalId(userId, args.goal);
          return {
            args: { goal: id },
            summary: `Archivar la meta ${await this.label(userId, id)}`,
            preview: {
              title: "Archivar meta",
              summary: "La meta quedará archivada.",
              fields: [{ label: "Meta", value: await this.label(userId, id) }],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveGoalId(userId, args.goal);
          const goal = await this.goals.archiveGoal(userId, id);
          return {
            ok: true,
            summary: `Archivé la meta "${goal.name}".`,
            data: { goal },
            entity: goalEntity(goal),
          };
        },
      },
      {
        name: "restoreGoal",
        title: "Restaurar meta",
        description: "Restaura una meta archivada (id o nombre).",
        classification: "sensitive",
        parameters: jsonSchema(
          { goal: { type: "string", description: "Meta (id o nombre)." } },
          ["goal"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveGoalId(userId, args.goal);
          return {
            args: { goal: id },
            summary: `Restaurar la meta ${await this.label(userId, id)}`,
            preview: {
              title: "Restaurar meta",
              summary: "La meta volverá a estar activa.",
              fields: [{ label: "Meta", value: await this.label(userId, id) }],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveGoalId(userId, args.goal);
          const goal = await this.goals.restoreGoal(userId, id);
          return {
            ok: true,
            summary: `Restauré la meta "${goal.name}".`,
            data: { goal },
            entity: goalEntity(goal),
          };
        },
      },
    ];
  }

  private async changes(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<UpdateGoalDto> {
    const candidate: Record<string, unknown> = {
      name: args.name,
      targetAmount: args.targetAmount,
      savedAmount: args.savedAmount,
      currency: optionalString(args.currency),
    };
    if (args.targetDate !== undefined) {
      candidate.targetDate = isUnset(args.targetDate)
        ? null
        : optionalString(args.targetDate);
    }
    if (args.sourceAccount !== undefined) {
      candidate.sourceAccountId = isUnset(args.sourceAccount)
        ? null
        : await this.resolver.resolveAccountId(userId, args.sourceAccount);
    }
    const defined = Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para la meta.",
      );
    }
    return validateToolArgs(UpdateGoalDto, defined);
  }

  private async label(userId: string, id: string): Promise<string> {
    const goal = await this.goals.getGoal(userId, id);
    return `${goal.name} (${goal.progressPct}%)`;
  }
}

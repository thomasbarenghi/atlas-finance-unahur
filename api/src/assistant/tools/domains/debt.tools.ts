import { HttpStatus, Injectable } from "@nestjs/common";
import {
  CreateDebtDto,
  DEBT_TYPE_VALUES,
} from "../../../debts/dto/create-debt.dto";
import { UpdateDebtDto } from "../../../debts/dto/update-debt.dto";
import { DebtsService } from "../../../debts/debts.service";
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

const debtEntity = (debt: {
  id: string;
  name: string;
  type: string;
  currency: string;
}): AssistantActionEntity => ({
  id: debt.id,
  name: debt.name,
  type: debt.type,
  currency: debt.currency,
});

const isUnlink = (value: unknown): boolean => {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return ["", "none", "ninguno", "ninguna", "null", "sin vincular"].includes(
    normalized,
  );
};

@Injectable()
export class DebtTools {
  constructor(
    private readonly debts: DebtsService,
    private readonly users: UsersService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listDebts",
        title: "Listar deudas",
        description:
          "Lista las deudas del usuario con su saldo, moneda y el activo vinculado si lo tiene.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const debts = await this.debts.listDebts(userId);
          return {
            ok: true,
            summary: `${debts.length} deuda(s).`,
            data: { debts },
          };
        },
      },
      {
        name: "createDebt",
        title: "Crear deuda",
        description:
          "Crea una deuda. Opcionalmente la vincula a un activo. Si no indicás moneda, se usa la moneda base del usuario.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            name: { type: "string" },
            type: { type: "string", enum: DEBT_TYPE_VALUES },
            balance: { type: "number", description: "Saldo (>= 0)." },
            currency: { type: "string" },
            date: { type: "string", description: "Fecha YYYY-MM-DD." },
            asset: {
              type: "string",
              description: "Activo a vincular (opcional).",
            },
          },
          ["name", "type", "balance", "date"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const user = await this.users.getById(userId);
          const assetId =
            args.asset === undefined || args.asset === null
              ? null
              : await this.resolver.resolveAssetId(userId, args.asset);
          const dto = await validateToolArgs(CreateDebtDto, {
            name: args.name,
            type: args.type,
            balance: args.balance,
            currency: optionalString(args.currency) ?? user.baseCurrency,
            date: args.date,
            assetId,
          });
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.name,
            summary: `Crear deuda "${dto.name}" por ${dto.balance} ${dto.currency}`,
            preview: {
              title: "Crear deuda",
              summary: `Se registrará "${dto.name}".`,
              fields: [
                { label: "Nombre", value: dto.name },
                { label: "Tipo", value: dto.type },
                { label: "Saldo", value: `${dto.balance} ${dto.currency}` },
                { label: "Fecha", value: dto.date },
                ...(assetId
                  ? [{ label: "Activo vinculado", value: assetId }]
                  : []),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateDebtDto, args);
          const debt = await this.debts.createDebt(userId, dto);
          return {
            ok: true,
            summary: `Creé la deuda "${debt.name}".`,
            data: { debt },
            entity: debtEntity(debt),
          };
        },
      },
      {
        name: "updateDebt",
        title: "Editar deuda",
        description:
          "Edita una deuda. Para vincular un activo usá 'asset'; para desvincular usá 'asset' vacío o 'ninguno'.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            debt: { type: "string", description: "Deuda (id o nombre)." },
            name: { type: "string" },
            type: { type: "string", enum: DEBT_TYPE_VALUES },
            balance: { type: "number" },
            currency: { type: "string" },
            date: { type: "string" },
            asset: {
              type: "string",
              description: "Activo a vincular o vacío.",
            },
          },
          ["debt"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { debt, ...rest } = args;
          const id = await this.resolver.resolveDebtId(userId, debt);
          const dto = await this.changes(userId, rest);
          return {
            args: { debt, ...dto },
            summary: `Editar la deuda ${id}`,
            preview: {
              title: "Editar deuda",
              summary: "Se actualizarán los datos de la deuda.",
              fields: [
                { label: "Deuda", value: await this.label(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { debt, ...rest } = args;
          const id = await this.resolver.resolveDebtId(userId, debt);
          const dto = await validateToolArgs(UpdateDebtDto, rest);
          const updated = await this.debts.updateDebt(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé la deuda "${updated.name}".`,
            data: { debt: updated },
            entity: debtEntity(updated),
          };
        },
      },
      {
        name: "archiveDebt",
        title: "Archivar deuda",
        description: "Archiva una deuda (id o nombre).",
        classification: "sensitive",
        parameters: jsonSchema(
          { debt: { type: "string", description: "Deuda (id o nombre)." } },
          ["debt"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveDebtId(userId, args.debt);
          return {
            args: { debt: id },
            summary: `Archivar la deuda ${await this.label(userId, id)}`,
            preview: {
              title: "Archivar deuda",
              summary: "La deuda dejará de contar en tu patrimonio.",
              fields: [{ label: "Deuda", value: await this.label(userId, id) }],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveDebtId(userId, args.debt);
          const debt = await this.debts.archiveDebt(userId, id);
          return {
            ok: true,
            summary: `Archivé la deuda "${debt.name}".`,
            data: { debt },
            entity: debtEntity(debt),
          };
        },
      },
    ];
  }

  private async changes(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<UpdateDebtDto> {
    const candidate: Record<string, unknown> = {
      name: args.name,
      type: args.type,
      balance: args.balance,
      currency: optionalString(args.currency),
      date: args.date,
    };
    if (args.asset !== undefined) {
      candidate.assetId = isUnlink(args.asset)
        ? null
        : await this.resolver.resolveAssetId(userId, args.asset);
    }
    const defined = Object.fromEntries(
      Object.entries(candidate).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para la deuda.",
      );
    }
    return validateToolArgs(UpdateDebtDto, defined);
  }

  private async label(userId: string, id: string): Promise<string> {
    const debts = await this.debts.listDebts(userId);
    const debt = debts.find((item) => item.id === id);
    return debt ? `${debt.name} (${debt.balance} ${debt.currency})` : id;
  }
}

import { Injectable } from "@nestjs/common";
import { AccountsService } from "../../../accounts/accounts.service";
import {
  ACCOUNT_TYPE_VALUES,
  CreateAccountDto,
} from "../../../accounts/dto/create-account.dto";
import { UpdateAccountDto } from "../../../accounts/dto/update-account.dto";
import { UsersService } from "../../../users/users.service";
import { ReferenceResolver } from "../reference-resolver.service";
import {
  jsonSchema,
  optionalString,
  validateChanges,
  validateToolArgs,
} from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const accountEntity = (account: {
  id: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
}): AssistantActionEntity => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  initialBalance: account.initialBalance,
});

@Injectable()
export class AccountTools {
  constructor(
    private readonly accounts: AccountsService,
    private readonly users: UsersService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listAccounts",
        title: "Listar cuentas",
        description:
          "Lista las cuentas del usuario con id, nombre, tipo, moneda, saldo inicial y actual, y si está archivada. Usala antes de editar, archivar o restaurar para resolver el nombre.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const accounts = await this.accounts.listAccounts(userId);
          return {
            ok: true,
            summary: accounts.length
              ? `El usuario tiene ${accounts.length} cuenta(s).`
              : "El usuario no tiene cuentas.",
            data: { accounts },
          };
        },
      },
      {
        name: "createAccount",
        title: "Crear cuenta",
        description:
          "Crea una cuenta financiera nueva (efectivo, banco, billetera, tarjeta u otra). Si no indicás moneda, se usa la moneda base del usuario; usá 0 como saldo inicial si el usuario no lo indica.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            name: { type: "string", description: "Nombre de la cuenta." },
            type: { type: "string", enum: ACCOUNT_TYPE_VALUES },
            currency: {
              type: "string",
              description:
                "Moneda ISO de 3 letras (ARS, USD…). Si no se indica, se usa la moneda base.",
            },
            initialBalance: {
              type: "number",
              description: "Saldo inicial. Usá 0 si no lo indica.",
            },
            notes: { type: "string", description: "Notas opcionales." },
          },
          ["name", "type"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const user = await this.users.getById(userId);
          const dto = await validateToolArgs(CreateAccountDto, {
            name: args.name,
            type: args.type,
            currency: optionalString(args.currency) ?? user.baseCurrency,
            initialBalance: args.initialBalance,
            notes: optionalString(args.notes) ?? null,
          });
          return {
            args: dto as unknown as Record<string, unknown>,
            createdEntityName: dto.name,
            summary: `Crear la cuenta "${dto.name}" en ${dto.currency.toUpperCase()}`,
            preview: {
              title: "Crear cuenta",
              summary: `Se creará la cuenta "${dto.name}".`,
              fields: [
                { label: "Nombre", value: dto.name },
                { label: "Tipo", value: dto.type },
                { label: "Moneda", value: dto.currency.toUpperCase() },
                {
                  label: "Saldo inicial",
                  value: String(dto.initialBalance ?? 0),
                },
                ...(dto.notes ? [{ label: "Notas", value: dto.notes }] : []),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateAccountDto, args);
          const account = await this.accounts.createAccount(userId, dto);
          return {
            ok: true,
            summary: `Creé la cuenta "${account.name}" en ${account.currency}.`,
            data: { account },
            entity: accountEntity(account),
          };
        },
      },
      {
        name: "updateAccount",
        title: "Editar cuenta",
        description:
          "Edita una cuenta existente del usuario. Acepta el id o el nombre de la cuenta.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            accountId: {
              type: "string",
              description: "Id (uuid) o nombre de la cuenta a editar.",
            },
            name: { type: "string", description: "Nuevo nombre." },
            type: { type: "string", enum: ACCOUNT_TYPE_VALUES },
            currency: { type: "string", description: "Nueva moneda." },
            initialBalance: {
              type: "number",
              description: "Nuevo saldo inicial.",
            },
            notes: { type: "string", description: "Nuevas notas." },
          },
          ["accountId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const { accountId, ...changes } = args;
          const id = await this.resolver.resolveAccountId(userId, accountId);
          const dto = await validateChanges(
            UpdateAccountDto,
            changes,
            "No indicaste ningún cambio para la cuenta.",
          );
          return {
            args: { accountId: id, ...dto },
            summary: `Editar la cuenta ${id}`,
            preview: {
              title: "Editar cuenta",
              summary: "Se actualizarán los datos de la cuenta.",
              fields: [
                { label: "Cuenta", value: await this.accountLabel(userId, id) },
                ...Object.entries(dto).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const { accountId, ...changes } = args;
          const id = await this.resolver.resolveAccountId(userId, accountId);
          const dto = await validateToolArgs(UpdateAccountDto, changes);
          const account = await this.accounts.updateAccount(userId, id, dto);
          return {
            ok: true,
            summary: `Actualicé la cuenta "${account.name}".`,
            data: { account },
            entity: accountEntity(account),
          };
        },
      },
      {
        name: "archiveAccount",
        title: "Archivar cuenta",
        description:
          "Archiva una cuenta del usuario. Una cuenta archivada conserva su historial y no admite movimientos.",
        classification: "sensitive",
        parameters: jsonSchema(
          {
            accountId: {
              type: "string",
              description: "Id (uuid) o nombre de la cuenta.",
            },
          },
          ["accountId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveAccountId(
            userId,
            args.accountId,
          );
          return {
            args: { accountId: id },
            summary: `Archivar la cuenta ${await this.accountLabel(userId, id)}`,
            preview: {
              title: "Archivar cuenta",
              summary:
                "La cuenta quedará archivada. Conserva su historial y no admitirá movimientos.",
              fields: [
                { label: "Cuenta", value: await this.accountLabel(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveAccountId(
            userId,
            args.accountId,
          );
          const account = await this.accounts.archiveAccount(userId, id);
          return {
            ok: true,
            summary: `Archivé la cuenta "${account.name}".`,
            data: { account },
            entity: accountEntity(account),
          };
        },
      },
      {
        name: "restoreAccount",
        title: "Restaurar cuenta",
        description: "Restaura una cuenta archivada del usuario.",
        classification: "sensitive",
        parameters: jsonSchema(
          {
            accountId: {
              type: "string",
              description: "Id (uuid) o nombre de la cuenta.",
            },
          },
          ["accountId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = await this.resolver.resolveAccountId(
            userId,
            args.accountId,
          );
          return {
            args: { accountId: id },
            summary: `Restaurar la cuenta ${await this.accountLabel(userId, id)}`,
            preview: {
              title: "Restaurar cuenta",
              summary: "La cuenta volverá a estar activa.",
              fields: [
                { label: "Cuenta", value: await this.accountLabel(userId, id) },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = await this.resolver.resolveAccountId(
            userId,
            args.accountId,
          );
          const account = await this.accounts.restoreAccount(userId, id);
          return {
            ok: true,
            summary: `Restauré la cuenta "${account.name}".`,
            data: { account },
            entity: accountEntity(account),
          };
        },
      },
    ];
  }

  private async accountLabel(userId: string, id: string): Promise<string> {
    const account = await this.accounts.getAccount(userId, id);
    return `${account.name} (${account.currency})`;
  }
}

import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../../../accounts/accounts.service";
import { CategoriesService } from "../../../categories/categories.service";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import {
  CreateTransactionDto,
  TRANSACTION_TYPE_VALUES,
} from "../../../transactions/dto/create-transaction.dto";
import { QueryTransactionsDto } from "../../../transactions/dto/query-transactions.dto";
import { UpdateTransactionDto } from "../../../transactions/dto/update-transaction.dto";
import { TransactionsService } from "../../../transactions/transactions.service";
import { ReferenceResolver } from "../reference-resolver.service";
import {
  jsonSchema,
  optionalString,
  requireString,
  validateToolArgs,
} from "../tool-input";
import type {
  AssistantActionEntity,
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

const WRITE_TYPES = TRANSACTION_TYPE_VALUES.filter(
  (type) => type !== "transfer",
);

const transactionEntity = (transaction: {
  id: string;
  description: string;
  type: string;
  currency: string;
}): AssistantActionEntity => ({
  id: transaction.id,
  name: transaction.description,
  type: transaction.type,
  currency: transaction.currency,
});

@Injectable()
export class TransactionTools {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
    private readonly resolver: ReferenceResolver,
  ) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "listTransactions",
        title: "Listar movimientos",
        description:
          "Lista movimientos (ingresos, gastos y transferencias) del usuario con filtros opcionales de fecha, tipo, cuenta, categoría y texto. Devuelve ids para editar o eliminar.",
        classification: "read",
        parameters: jsonSchema({
          from: { type: "string", description: "Desde YYYY-MM-DD." },
          to: { type: "string", description: "Hasta YYYY-MM-DD." },
          type: { type: "string", enum: TRANSACTION_TYPE_VALUES },
          account: { type: "string", description: "Cuenta (id o nombre)." },
          category: {
            type: "string",
            description:
              "Categoría (id o nombre interno devuelto por listCategories, por ejemplo other_expense).",
          },
          search: {
            type: "string",
            description: "Texto en descripción o notas.",
          },
          page: { type: "number" },
          pageSize: { type: "number" },
        }),
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const filters = await this.buildFilters(userId, args);
          const result = await this.transactions.listTransactions(
            userId,
            filters,
          );
          return {
            ok: true,
            summary: `${result.total} movimiento(s) encontrados.`,
            data: result,
          };
        },
      },
      {
        name: "createTransaction",
        title: "Crear movimiento",
        description:
          "Crea un ingreso o gasto. No sirve para transferencias: para eso usá transferBetweenAccounts. Si no indicás la moneda, se toma la de la cuenta.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            type: { type: "string", enum: WRITE_TYPES },
            amount: { type: "number", description: "Monto positivo." },
            date: { type: "string", description: "Fecha YYYY-MM-DD." },
            description: { type: "string" },
            account: { type: "string", description: "Cuenta (id o nombre)." },
            category: {
              type: "string",
              description:
                "Categoría (id o nombre interno devuelto por listCategories, por ejemplo other_expense).",
            },
            currency: { type: "string", description: "Moneda opcional." },
            notes: { type: "string" },
          },
          ["type", "amount", "date", "description", "account"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const type = args.type;
          if (type !== "income" && type !== "expense") {
            throw new ApiException(
              ErrorCode.VALIDATION_ERROR,
              HttpStatus.BAD_REQUEST,
              "El tipo debe ser ingreso o gasto.",
            );
          }
          const accountId = await this.resolver.resolveAccountId(
            userId,
            args.account,
          );
          const account = await this.accounts.getAccount(userId, accountId);
          const categoryId =
            args.category === undefined || args.category === null
              ? null
              : await this.resolver.resolveCategoryId(
                  userId,
                  args.category,
                  type,
                );
          const dto = await validateToolArgs(CreateTransactionDto, {
            type,
            amount: args.amount,
            currency: optionalString(args.currency) ?? account.currency,
            date: args.date,
            description: args.description,
            notes: optionalString(args.notes) ?? null,
            accountId,
            categoryId,
          });
          return {
            args: dto as unknown as Record<string, unknown>,
            summary: `Registrar ${type === "income" ? "ingreso" : "gasto"} de ${dto.amount} ${dto.currency} en ${account.name}`,
            preview: {
              title:
                type === "income" ? "Registrar ingreso" : "Registrar gasto",
              summary: dto.description,
              fields: [
                {
                  label: "Tipo",
                  value: type === "income" ? "Ingreso" : "Gasto",
                },
                { label: "Monto", value: `${dto.amount} ${dto.currency}` },
                { label: "Fecha", value: dto.date },
                { label: "Cuenta", value: account.name },
                {
                  label: "Categoría",
                  value: categoryId
                    ? await this.categoryName(userId, categoryId)
                    : "Sin categoría",
                },
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateTransactionDto, args);
          const transaction = await this.transactions.createTransaction(
            userId,
            dto,
          );
          return {
            ok: true,
            summary: `Registré "${transaction.description}" por ${transaction.amount} ${transaction.currency}.`,
            data: { transaction },
            entity: transactionEntity(transaction),
          };
        },
      },
      {
        name: "transferBetweenAccounts",
        title: "Transferir entre cuentas",
        description:
          "Transfiere dinero entre dos cuentas propias de la misma moneda. Se registran ambos lados de forma atómica y no afecta ingresos ni gastos.",
        classification: "sensitive",
        parameters: jsonSchema(
          {
            amount: { type: "number", description: "Monto positivo." },
            date: { type: "string", description: "Fecha YYYY-MM-DD." },
            description: { type: "string" },
            fromAccount: { type: "string", description: "Cuenta origen." },
            toAccount: { type: "string", description: "Cuenta destino." },
            notes: { type: "string" },
          },
          ["amount", "date", "description", "fromAccount", "toAccount"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const accountId = await this.resolver.resolveAccountId(
            userId,
            args.fromAccount,
          );
          const transferAccountId = await this.resolver.resolveAccountId(
            userId,
            args.toAccount,
          );
          const origin = await this.accounts.getAccount(userId, accountId);
          const dto = await validateToolArgs(CreateTransactionDto, {
            type: "transfer",
            amount: args.amount,
            currency: origin.currency,
            date: args.date,
            description: args.description,
            notes: optionalString(args.notes) ?? null,
            accountId,
            transferAccountId,
          });
          const destination = await this.accounts.getAccount(
            userId,
            transferAccountId,
          );
          return {
            args: dto as unknown as Record<string, unknown>,
            summary: `Transferir ${dto.amount} ${dto.currency} de ${origin.name} a ${destination.name}`,
            preview: {
              title: "Transferencia",
              summary: dto.description,
              fields: [
                { label: "Monto", value: `${dto.amount} ${dto.currency}` },
                { label: "Fecha", value: dto.date },
                { label: "Origen", value: origin.name },
                { label: "Destino", value: destination.name },
              ],
              impact:
                "Se registran dos movimientos atómicos y no afecta tus ingresos ni gastos.",
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await validateToolArgs(CreateTransactionDto, args);
          const transaction = await this.transactions.createTransaction(
            userId,
            dto,
          );
          return {
            ok: true,
            summary: `Transferí ${Math.abs(transaction.amount)} ${transaction.currency}.`,
            data: { transaction },
            entity: transactionEntity(transaction),
          };
        },
      },
      {
        name: "updateTransaction",
        title: "Editar movimiento",
        description:
          "Edita un ingreso o gasto existente por su id (no transferencias). Permite cambiar monto, fecha, descripción, notas, categoría, tipo, cuenta y moneda. Requiere listTransactions para obtener el id.",
        classification: "write_safe",
        parameters: jsonSchema(
          {
            transactionId: {
              type: "string",
              description: "Id (uuid) del movimiento.",
            },
            type: { type: "string", enum: WRITE_TYPES },
            amount: { type: "number" },
            date: { type: "string", description: "YYYY-MM-DD." },
            description: { type: "string" },
            notes: { type: "string" },
            account: {
              type: "string",
              description: "Cuenta nueva (id o nombre).",
            },
            currency: {
              type: "string",
              description: "Moneda nueva; debe coincidir con la de la cuenta.",
            },
            category: {
              type: "string",
              description:
                "Categoría (id o nombre interno devuelto por listCategories, por ejemplo other_expense).",
            },
          },
          ["transactionId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = requireString(
            args.transactionId,
            "Falta indicar el movimiento a editar.",
          );
          await this.transactions.getTransaction(userId, id);
          const changes = await this.buildUpdate(userId, args);
          return {
            args: { transactionId: id, ...changes },
            summary: `Editar el movimiento ${id}`,
            preview: {
              title: "Editar movimiento",
              summary: "Se actualizará el movimiento.",
              fields: [
                { label: "Movimiento", value: id },
                ...Object.entries(changes).map(([key, value]) => ({
                  label: key,
                  value: String(value),
                })),
              ],
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = requireString(
            args.transactionId,
            "Falta indicar el movimiento a editar.",
          );
          const changes = await this.buildUpdate(userId, args);
          const transaction = await this.transactions.updateTransaction(
            userId,
            id,
            changes,
          );
          return {
            ok: true,
            summary: `Actualicé "${transaction.description}".`,
            data: { transaction },
            entity: transactionEntity(transaction),
          };
        },
      },
      {
        name: "deleteTransaction",
        title: "Eliminar movimiento",
        description:
          "Elimina un movimiento por su id. Si es una transferencia, elimina ambos lados. Es una acción destructiva.",
        classification: "destructive",
        parameters: jsonSchema(
          {
            transactionId: {
              type: "string",
              description: "Id (uuid) del movimiento.",
            },
          },
          ["transactionId"],
        ),
        prepare: async (userId, args): Promise<PreparedAction> => {
          const id = requireString(
            args.transactionId,
            "Falta indicar el movimiento a eliminar.",
          );
          const transaction = await this.transactions.getTransaction(
            userId,
            id,
          );
          const impact = transaction.transferGroupId
            ? "Se eliminarán los dos lados de la transferencia."
            : undefined;
          return {
            args: { transactionId: id },
            summary: `Eliminar "${transaction.description}"`,
            preview: {
              title: "Eliminar movimiento",
              summary: `Se eliminará "${transaction.description}" por ${transaction.amount} ${transaction.currency}.`,
              fields: [
                { label: "Descripción", value: transaction.description },
                { label: "Fecha", value: transaction.date },
                {
                  label: "Monto",
                  value: `${transaction.amount} ${transaction.currency}`,
                },
              ],
              impact,
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const id = requireString(
            args.transactionId,
            "Falta indicar el movimiento a eliminar.",
          );
          const transaction = await this.transactions.getTransaction(
            userId,
            id,
          );
          await this.transactions.deleteTransaction(userId, id);
          return {
            ok: true,
            summary: `Eliminé "${transaction.description}".`,
            data: { id },
            entity: transactionEntity(transaction),
          };
        },
      },
    ];
  }

  private async buildFilters(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<QueryTransactionsDto> {
    const accountId =
      args.account === undefined || args.account === null
        ? undefined
        : await this.resolver.resolveAccountId(userId, args.account);
    const categoryId =
      args.category === undefined || args.category === null
        ? undefined
        : await this.resolver.resolveCategoryId(userId, args.category);
    return validateToolArgs(QueryTransactionsDto, {
      from: args.from,
      to: args.to,
      type: args.type,
      accountId,
      categoryId,
      search: args.search,
      page: args.page,
      pageSize: args.pageSize,
    });
  }

  private async buildUpdate(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<UpdateTransactionDto> {
    const changes: Record<string, unknown> = {
      type: args.type,
      amount: args.amount,
      date: args.date,
      description: args.description,
      notes: optionalString(args.notes),
      currency: optionalString(args.currency),
    };
    if (args.account !== undefined && args.account !== null) {
      changes.accountId = await this.resolver.resolveAccountId(
        userId,
        args.account,
      );
    }
    if (args.category !== undefined && args.category !== null) {
      changes.categoryId = await this.resolver.resolveCategoryId(
        userId,
        args.category,
      );
    }
    const defined = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para el movimiento.",
      );
    }
    return validateToolArgs(UpdateTransactionDto, defined);
  }

  private async categoryName(userId: string, id: string): Promise<string> {
    const category = await this.categories.assertCategoryUsable(userId, id);
    return category.name;
  }
}

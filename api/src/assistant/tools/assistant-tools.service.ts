import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AccountsService } from "../../accounts/accounts.service";
import { AccountResponseDto } from "../../accounts/dto/account-response.dto";
import {
  ACCOUNT_TYPE_VALUES,
  CreateAccountDto,
} from "../../accounts/dto/create-account.dto";
import { UpdateAccountDto } from "../../accounts/dto/update-account.dto";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { flattenValidationErrors } from "../../common/pipes/validation-exception.factory";
import { AiTool, AiToolCall } from "../../shared/ai/ai.service";
import { AssistantActionEntity, ToolResult } from "./tool.types";

const toActionEntity = (
  account: AccountResponseDto,
): AssistantActionEntity => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  initialBalance: account.initialBalance,
});

@Injectable()
export class AssistantToolsService {
  private readonly logger = new Logger(AssistantToolsService.name);

  constructor(private readonly accountsService: AccountsService) {}

  getToolDefinitions(): AiTool[] {
    return [
      {
        type: "function",
        function: {
          name: "listAccounts",
          description:
            "Lista las cuentas del usuario con su id, nombre, tipo, moneda y saldo inicial. Usala para resolver el id de una cuenta antes de editarla.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "createAccount",
          description:
            "Crea una cuenta financiera nueva para el usuario. Usala cuando pida crear, abrir o agregar una cuenta. Si no indica saldo inicial, usá 0.",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description:
                  "Nombre de la cuenta, por ejemplo 'Banco Galicia'.",
              },
              type: {
                type: "string",
                enum: ACCOUNT_TYPE_VALUES,
                description: "Tipo de cuenta.",
              },
              currency: {
                type: "string",
                description: "Código ISO de 3 letras, por ejemplo ARS o USD.",
              },
              initialBalance: {
                type: "number",
                description:
                  "Saldo inicial de la cuenta. Usá 0 si no lo indica.",
              },
              notes: {
                type: "string",
                description: "Notas opcionales sobre la cuenta.",
              },
            },
            required: ["name", "type", "currency"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "updateAccount",
          description:
            "Edita una cuenta existente del usuario. Requiere accountId: usá listAccounts primero para resolverlo por nombre.",
          parameters: {
            type: "object",
            properties: {
              accountId: {
                type: "string",
                description: "UUID de la cuenta a editar.",
              },
              name: { type: "string", description: "Nuevo nombre." },
              type: {
                type: "string",
                enum: ACCOUNT_TYPE_VALUES,
                description: "Nuevo tipo de cuenta.",
              },
              currency: {
                type: "string",
                description: "Nueva moneda (ISO de 3 letras).",
              },
              initialBalance: {
                type: "number",
                description: "Nuevo saldo inicial.",
              },
              notes: { type: "string", description: "Nuevas notas." },
            },
            required: ["accountId"],
            additionalProperties: false,
          },
        },
      },
    ];
  }

  async execute(call: AiToolCall, userId: string): Promise<ToolResult> {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(call.function.arguments || "{}") as Record<
        string,
        unknown
      >;
    } catch {
      return {
        toolCallId: call.id,
        name: call.function.name,
        ok: false,
        mutates: false,
        summary: "No pude interpretar los datos de la acción.",
      };
    }

    try {
      switch (call.function.name) {
        case "listAccounts":
          return await this.listAccounts(call, userId);
        case "createAccount":
          return await this.createAccount(call, userId, args);
        case "updateAccount":
          return await this.updateAccount(call, userId, args);
        default:
          return {
            toolCallId: call.id,
            name: call.function.name,
            ok: false,
            mutates: false,
            summary: "La acción solicitada no está disponible.",
          };
      }
    } catch (error) {
      if (error instanceof ApiException) {
        const body = error.getResponse() as { message?: string };
        return {
          toolCallId: call.id,
          name: call.function.name,
          ok: false,
          mutates: false,
          summary: body.message ?? "No se pudo completar la acción.",
        };
      }
      this.logger.error("Assistant tool execution failed");
      return {
        toolCallId: call.id,
        name: call.function.name,
        ok: false,
        mutates: false,
        summary: "No se pudo completar la acción.",
      };
    }
  }

  private async listAccounts(
    call: AiToolCall,
    userId: string,
  ): Promise<ToolResult> {
    const accounts = await this.accountsService.listAccounts(userId);
    return {
      toolCallId: call.id,
      name: call.function.name,
      ok: true,
      mutates: false,
      summary: accounts.length
        ? `El usuario tiene ${accounts.length} cuenta(s).`
        : "El usuario no tiene cuentas.",
      data: { accounts },
    };
  }

  private async createAccount(
    call: AiToolCall,
    userId: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    const dto = await this.validate(CreateAccountDto, args);
    const account = await this.accountsService.createAccount(userId, dto);
    return {
      toolCallId: call.id,
      name: call.function.name,
      ok: true,
      mutates: true,
      summary: `Creé la cuenta "${account.name}" en ${account.currency}.`,
      data: { account },
      entity: toActionEntity(account),
    };
  }

  private async updateAccount(
    call: AiToolCall,
    userId: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    const { accountId, ...changes } = args;
    if (typeof accountId !== "string" || accountId.length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Falta indicar qué cuenta editar.",
      );
    }
    if (Object.keys(changes).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ningún cambio para la cuenta.",
      );
    }

    const dto = await this.validate(UpdateAccountDto, changes);
    const account = await this.accountsService.updateAccount(
      userId,
      accountId,
      dto,
    );
    return {
      toolCallId: call.id,
      name: call.function.name,
      ok: true,
      mutates: true,
      summary: `Actualicé la cuenta "${account.name}".`,
      data: { account },
      entity: toActionEntity(account),
    };
  }

  private async validate<T extends object>(
    metatype: new () => T,
    value: unknown,
  ): Promise<T> {
    const instance = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    });
    const errors = await validate(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Los datos de la acción no son válidos.",
        flattenValidationErrors(errors),
      );
    }
    return instance;
  }
}

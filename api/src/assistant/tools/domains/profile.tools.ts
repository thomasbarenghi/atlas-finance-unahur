import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../../../common/errors/api.exception";
import { ErrorCode } from "../../../common/errors/error-codes";
import {
  THEME_VALUES,
  UpdateUserDto,
} from "../../../users/dto/update-user.dto";
import { UsersService } from "../../../users/users.service";
import { jsonSchema, validateToolArgs } from "../tool-input";
import type {
  PreparedAction,
  ToolDefinition,
  ToolHandlerResult,
} from "../tool.types";

@Injectable()
export class ProfileTools {
  constructor(private readonly users: UsersService) {}

  definitions(): ToolDefinition[] {
    return [
      {
        name: "getProfile",
        title: "Ver perfil y preferencias",
        description:
          "Devuelve el nombre, email, moneda base, tema e IA habilitada del usuario.",
        classification: "read",
        parameters: jsonSchema({}),
        execute: async (userId): Promise<ToolHandlerResult> => {
          const user = await this.users.getById(userId);
          return {
            ok: true,
            summary: "Perfil del usuario.",
            data: { user },
          };
        },
      },
      {
        name: "updatePreferences",
        title: "Actualizar preferencias",
        description:
          "Actualiza el nombre, el tema o el interruptor del asistente. No cambia la moneda base ni la habilitación de acciones destructivas.",
        classification: "sensitive",
        parameters: jsonSchema({
          name: { type: "string" },
          theme: { type: "string", enum: THEME_VALUES },
          aiEnabled: { type: "boolean" },
        }),
        prepare: async (_userId, args): Promise<PreparedAction> => {
          const dto = await this.changes(args);
          return {
            args: dto as unknown as Record<string, unknown>,
            summary: "Actualizar tus preferencias",
            preview: {
              title: "Actualizar preferencias",
              summary: "Se actualizarán tus preferencias de perfil.",
              fields: Object.entries(dto).map(([key, value]) => ({
                label: key,
                value: String(value),
              })),
            },
          };
        },
        execute: async (userId, args): Promise<ToolHandlerResult> => {
          const dto = await this.changes(args);
          const user = await this.users.updateMe(userId, dto);
          return {
            ok: true,
            summary: "Actualicé tus preferencias.",
            data: { user },
          };
        },
      },
    ];
  }

  private async changes(args: Record<string, unknown>) {
    const defined = Object.fromEntries(
      Object.entries({
        name: args.name,
        theme: args.theme,
        aiEnabled: args.aiEnabled,
      }).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(defined).length === 0) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "No indicaste ninguna preferencia para cambiar.",
      );
    }
    return validateToolArgs(UpdateUserDto, defined);
  }
}

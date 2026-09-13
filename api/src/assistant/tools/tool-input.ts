import { HttpStatus } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { flattenValidationErrors } from "../../common/pipes/validation-exception.factory";
import type { AiToolCall } from "../../shared/ai/ai.service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): boolean =>
  typeof value === "string" && UUID.test(value);

export const parseToolArgs = (call: AiToolCall): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(call.function.arguments || "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("not an object");
  } catch {
    throw new ApiException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      "No pude interpretar los datos de la acción.",
    );
  }
};

export const validateToolArgs = async <T extends object>(
  metatype: new () => T,
  value: unknown,
): Promise<T> => {
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
};

/**
 * Valida un conjunto de cambios parciales y falla si no se indicó ninguno.
 * Centraliza el patrón repetido en las tools de edición.
 */
export const validateChanges = <T extends object>(
  metatype: new () => T,
  changes: Record<string, unknown>,
  emptyMessage: string,
): Promise<T> => {
  if (Object.keys(changes).length === 0) {
    throw new ApiException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      emptyMessage,
    );
  }
  return validateToolArgs(metatype, changes);
};

export const requireString = (value: unknown, message: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      message,
    );
  }
  return value.trim();
};

export const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;

export const jsonSchema = (
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

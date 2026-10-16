import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { ClassConstructor } from "class-transformer";

/*
 * These are the real request DTOs from the NestJS API (`../api/src/**`), the
 * source of truth for what the backend accepts. Contract tests build payloads
 * the way the frontend does and validate them against these classes, so a
 * backend change that the client does not follow fails a test.
 */
import { RegisterDto } from "../../../api/src/auth/dto/register.dto";
import { LoginDto } from "../../../api/src/auth/dto/login.dto";
import { UpdateUserDto } from "../../../api/src/users/dto/update-user.dto";
import { CreateAccountDto } from "../../../api/src/accounts/dto/create-account.dto";
import { UpdateAccountDto } from "../../../api/src/accounts/dto/update-account.dto";
import { CreateTransactionDto } from "../../../api/src/transactions/dto/create-transaction.dto";
import { UpdateTransactionDto } from "../../../api/src/transactions/dto/update-transaction.dto";
import { AssistantMessageDto } from "../../../api/src/assistant/dto/assistant-message.dto";
import { DashboardQueryDto } from "../../../api/src/dashboard/dto/dashboard-query.dto";

export const apiRequestDtos = {
  RegisterDto,
  LoginDto,
  UpdateUserDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  AssistantMessageDto,
  DashboardQueryDto,
};

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a frontend-built payload against an API DTO using the same
 * `class-validator` rules the API's global `ValidationPipe` applies
 * (`whitelist`, `forbidNonWhitelisted`, `transform`).
 */
export const validateApiPayload = async (
  dto: ClassConstructor<object>,
  payload: object,
  options: { forbidNonWhitelisted?: boolean } = {},
): Promise<ContractValidationResult> => {
  const instance = plainToInstance(dto, payload, {
    enableImplicitConversion: false,
  });
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: options.forbidNonWhitelisted ?? true,
    skipMissingProperties: false,
  });
  return {
    valid: errors.length === 0,
    errors: errors.flatMap((error) =>
      Object.values(error.constraints ?? {}).map(
        (message) => `${error.property}: ${message}`,
      ),
    ),
  };
};

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
import { ForgotPasswordDto } from "../../../api/src/auth/dto/forgot-password.dto";
import { ResetPasswordDto } from "../../../api/src/auth/dto/reset-password.dto";
import { UpdateUserDto } from "../../../api/src/users/dto/update-user.dto";
import { CreateAccountDto } from "../../../api/src/accounts/dto/create-account.dto";
import { UpdateAccountDto } from "../../../api/src/accounts/dto/update-account.dto";
import { CreateTransactionDto } from "../../../api/src/transactions/dto/create-transaction.dto";
import { UpdateTransactionDto } from "../../../api/src/transactions/dto/update-transaction.dto";
import { QueryTransactionsDto } from "../../../api/src/transactions/dto/query-transactions.dto";
import { CreateBudgetDto } from "../../../api/src/budgets/dto/create-budget.dto";
import { UpdateBudgetDto } from "../../../api/src/budgets/dto/update-budget.dto";
import { CopyBudgetsDto } from "../../../api/src/budgets/dto/copy-budgets.dto";
import { QueryBudgetsDto } from "../../../api/src/budgets/dto/query-budgets.dto";
import { CreateCategoryDto } from "../../../api/src/categories/dto/create-category.dto";
import { UpdateCategoryDto } from "../../../api/src/categories/dto/update-category.dto";
import { CreateGoalDto } from "../../../api/src/goals/dto/create-goal.dto";
import { UpdateGoalDto } from "../../../api/src/goals/dto/update-goal.dto";
import { CreateAssetDto } from "../../../api/src/assets/dto/create-asset.dto";
import { UpdateAssetDto } from "../../../api/src/assets/dto/update-asset.dto";
import { CreateValuationDto } from "../../../api/src/assets/dto/create-valuation.dto";
import { CreateDebtDto } from "../../../api/src/debts/dto/create-debt.dto";
import { UpdateDebtDto } from "../../../api/src/debts/dto/update-debt.dto";
import { CreatePositionDto } from "../../../api/src/positions/dto/create-position.dto";
import { UpdatePositionDto } from "../../../api/src/positions/dto/update-position.dto";
import { AssistantMessageDto } from "../../../api/src/assistant/dto/assistant-message.dto";
import { ConfirmActionDto } from "../../../api/src/assistant/dto/confirm-action.dto";
import { DashboardQueryDto } from "../../../api/src/dashboard/dto/dashboard-query.dto";

export const apiRequestDtos = {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  QueryTransactionsDto,
  CreateBudgetDto,
  UpdateBudgetDto,
  CopyBudgetsDto,
  QueryBudgetsDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateGoalDto,
  UpdateGoalDto,
  CreateAssetDto,
  UpdateAssetDto,
  CreateValuationDto,
  CreateDebtDto,
  UpdateDebtDto,
  CreatePositionDto,
  UpdatePositionDto,
  AssistantMessageDto,
  ConfirmActionDto,
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

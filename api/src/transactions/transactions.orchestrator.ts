import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { CategoriesService } from "../categories/categories.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

/**
 * Composite use cases of the transactions domain that cross into accounts and
 * categories: validating that the referenced account(s) belong to the user and
 * that the category exists (FR-TRX-004, NFR-SEG-001). The orchestrator defines
 * the order and delegates persistence to `TransactionsService`.
 */
@Injectable()
export class TransactionsOrchestrator {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.accountsService.assertAccountOwned(userId, dto.accountId);

    if (dto.type === "transfer") {
      if (!dto.transferAccountId) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "Elegí una cuenta de destino",
          { transferAccountId: ["Seleccioná la cuenta de destino"] },
        );
      }
      if (dto.transferAccountId === dto.accountId) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "Las cuentas deben ser distintas",
          { transferAccountId: ["Debe ser distinta de la cuenta origen"] },
        );
      }
      await this.accountsService.assertAccountOwned(
        userId,
        dto.transferAccountId,
      );
    } else if (dto.categoryId) {
      await this.categoriesService.assertCategoryExists(dto.categoryId);
    }

    return this.transactionsService.createTransaction(userId, dto);
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const existing = await this.transactionsService.getTransaction(userId, id);

    if (existing.type === "transfer") {
      const origin = dto.accountId ?? existing.accountId;
      const destination = dto.transferAccountId ?? existing.transferAccountId;
      if (!destination || origin === destination) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "Las cuentas deben ser distintas",
          { transferAccountId: ["Debe ser distinta de la cuenta origen"] },
        );
      }
      await Promise.all([
        this.accountsService.assertAccountOwned(userId, origin),
        this.accountsService.assertAccountOwned(userId, destination),
      ]);
    } else if (dto.accountId) {
      await this.accountsService.assertAccountOwned(userId, dto.accountId);
    }

    if (existing.type !== "transfer" && dto.categoryId) {
      await this.categoriesService.assertCategoryExists(dto.categoryId);
    }

    return this.transactionsService.updateTransaction(userId, id, dto);
  }
}

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
 * categories: validating that the referenced account(s) belong to the user, are
 * not archived, share the movement currency, and that the category is usable
 * (FR-TRX-004, FR-CUE-005, NFR-SEG-001). The orchestrator defines the order and
 * delegates persistence to `TransactionsService`.
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
    const account = await this.accountsService.assertAccountUsable(
      userId,
      dto.accountId,
    );
    this.assertCurrency(account.currency, dto.currency);

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
      const destination = await this.accountsService.assertAccountUsable(
        userId,
        dto.transferAccountId,
      );
      this.assertCurrency(destination.currency, dto.currency);
    } else if (dto.categoryId) {
      await this.categoriesService.assertCategoryUsable(userId, dto.categoryId);
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
      const currency = (dto.currency ?? existing.currency).toUpperCase();
      const [originAccount, destinationAccount] = await Promise.all([
        this.accountsService.assertAccountUsable(userId, origin),
        this.accountsService.assertAccountUsable(userId, destination),
      ]);
      this.assertCurrency(originAccount.currency, currency);
      this.assertCurrency(destinationAccount.currency, currency);
    } else if (dto.accountId) {
      const account = await this.accountsService.assertAccountUsable(
        userId,
        dto.accountId,
      );
      this.assertCurrency(account.currency, dto.currency ?? existing.currency);
    } else if (dto.currency !== undefined) {
      const account = await this.accountsService.assertAccountUsable(
        userId,
        existing.accountId,
      );
      this.assertCurrency(account.currency, dto.currency);
    }

    if (existing.type !== "transfer" && dto.categoryId) {
      await this.categoriesService.assertCategoryUsable(userId, dto.categoryId);
    }

    return this.transactionsService.updateTransaction(userId, id, dto);
  }

  private assertCurrency(accountCurrency: string, currency: string): void {
    if (accountCurrency.toUpperCase() !== currency.toUpperCase()) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "La moneda del movimiento debe coincidir con la de la cuenta",
        { currency: ["Debe coincidir con la moneda de la cuenta"] },
      );
    }
  }
}

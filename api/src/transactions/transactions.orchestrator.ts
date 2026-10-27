import { HttpStatus, Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { CategoriesService } from "../categories/categories.service";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

const missingTransferAmount = () =>
  new ApiException(
    ErrorCode.VALIDATION_ERROR,
    HttpStatus.BAD_REQUEST,
    "Indicá el monto que llega a la cuenta destino",
    { transferAmount: ["Ingresá el monto en la moneda de destino"] },
  );

/**
 * Composite use cases of the transactions domain that cross into accounts and
 * categories: validating ownership, the category type and the two amounts of a
 * multi-currency transfer (FR-TRX-002/004, NFR-SEG-001). The orchestrator
 * defines the order and delegates persistence to `TransactionsService`.
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
    const origin = await this.accountsService.assertAccountOwned(
      userId,
      dto.accountId,
    );

    if (dto.type === "transfer") {
      if (!dto.transferAccountId) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "Elegí una cuenta de destino",
          { transferAccountId: ["Seleccioná la cuenta de destino"] },
        );
      }
      const destination = await this.accountsService.assertAccountOwned(
        userId,
        dto.transferAccountId,
      );
      if (origin.currency === destination.currency) {
        dto.transferAmount = Math.abs(dto.amount);
      } else if (dto.transferAmount === undefined) {
        throw missingTransferAmount();
      }
    } else if (dto.categoryId) {
      await this.categoriesService.assertCategoryAssignable(
        userId,
        dto.categoryId,
        dto.type === "income" ? "income" : "expense",
      );
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
      const group = await this.transactionsService.getTransferGroup(userId, id);
      if (!group) {
        throw new ApiException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          "El movimiento no existe",
        );
      }
      const originId = dto.accountId ?? group.outbound.accountId;
      const destinationId = dto.transferAccountId ?? group.inbound.accountId;
      if (!destinationId) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "Las cuentas deben ser distintas",
          { transferAccountId: ["Debe ser distinta de la cuenta origen"] },
        );
      }
      const [origin, destination] = await Promise.all([
        this.accountsService.assertAccountOwned(userId, originId),
        this.accountsService.assertAccountOwned(userId, destinationId),
      ]);

      if (origin.currency === destination.currency) {
        dto.transferAmount =
          dto.amount !== undefined
            ? Math.abs(dto.amount)
            : Math.abs(group.inbound.amount);
      } else {
        const amountChanged =
          dto.amount !== undefined &&
          Math.abs(dto.amount) !== Math.abs(group.outbound.amount);
        const accountsChanged =
          dto.accountId !== undefined || dto.transferAccountId !== undefined;
        if (
          (amountChanged || accountsChanged) &&
          dto.transferAmount === undefined
        ) {
          throw missingTransferAmount();
        }
      }
    } else if (dto.accountId) {
      await this.accountsService.assertAccountOwned(userId, dto.accountId);
    }

    const nextType = dto.type ?? existing.type;
    if (nextType !== "transfer") {
      const nextCategoryId =
        dto.categoryId !== undefined ? dto.categoryId : existing.categoryId;
      if (
        nextCategoryId &&
        (dto.categoryId !== undefined || dto.type !== undefined)
      ) {
        await this.categoriesService.assertCategoryAssignable(
          userId,
          nextCategoryId,
          nextType,
        );
      }
    }

    return this.transactionsService.updateTransaction(userId, id, dto);
  }
}

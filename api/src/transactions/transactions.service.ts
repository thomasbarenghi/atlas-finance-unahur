import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { DataSource, Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { Paginated } from "../common/dto/pagination.dto";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Category } from "../categories/entities/category.entity";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";
import {
  toTransactionResponse,
  TransactionResponseDto,
} from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { Transaction } from "./entities/transaction.entity";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async listTransactions(
    userId: string,
    filters: QueryTransactionsDto,
  ): Promise<Paginated<TransactionResponseDto>> {
    const query = this.transactionsRepository
      .createQueryBuilder("transaction")
      .where("transaction.user_id = :userId", { userId });

    if (filters.from) {
      query.andWhere("transaction.date >= :from", { from: filters.from });
    }
    if (filters.to) {
      query.andWhere("transaction.date <= :to", { to: filters.to });
    }
    if (filters.type) {
      query.andWhere("transaction.type = :type", { type: filters.type });
    }
    if (filters.accountId) {
      query.andWhere(
        "(transaction.account_id = :accountId OR transaction.transfer_account_id = :accountId)",
        { accountId: filters.accountId },
      );
    }
    if (filters.categoryId) {
      query.andWhere("transaction.category_id = :categoryId", {
        categoryId: filters.categoryId,
      });
    }
    if (filters.search) {
      query.andWhere(
        "(transaction.description ILIKE :search OR transaction.notes ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    query
      .orderBy("transaction.date", "DESC")
      .addOrderBy("transaction.created_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map(toTransactionResponse),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getTransaction(
    userId: string,
    id: string,
  ): Promise<TransactionResponseDto> {
    return toTransactionResponse(await this.findOwnedTransaction(userId, id));
  }

  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const account = await this.assertAccountUsable(userId, dto.accountId);
    this.assertCurrencyMatches(account, dto.currency);

    if (dto.type === "transfer") {
      return this.createTransfer(userId, dto);
    }

    if (dto.categoryId) {
      await this.assertCategoryUsable(userId, dto.categoryId);
    }

    const transaction = this.transactionsRepository.create({
      userId,
      type: dto.type,
      amount: Math.abs(dto.amount),
      currency: dto.currency.toUpperCase(),
      date: dto.date,
      description: dto.description.trim(),
      notes: dto.notes?.trim() || null,
      accountId: dto.accountId,
      transferAccountId: null,
      categoryId: dto.categoryId ?? null,
      transferGroupId: null,
    });
    return toTransactionResponse(
      await this.transactionsRepository.save(transaction),
    );
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.findOwnedTransaction(userId, id);

    if (transaction.type === "transfer" && transaction.transferGroupId) {
      return this.updateTransfer(userId, transaction, dto);
    }

    if (dto.accountId) {
      const account = await this.assertAccountUsable(userId, dto.accountId);
      this.assertCurrencyMatches(account, dto.currency ?? transaction.currency);
      transaction.accountId = dto.accountId;
    } else if (dto.currency !== undefined) {
      const account = await this.assertAccountUsable(
        userId,
        transaction.accountId,
      );
      this.assertCurrencyMatches(account, dto.currency);
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        await this.assertCategoryUsable(userId, dto.categoryId);
      }
      transaction.categoryId = dto.categoryId;
    }
    if (dto.type !== undefined) transaction.type = dto.type;
    if (dto.amount !== undefined) transaction.amount = Math.abs(dto.amount);
    if (dto.currency !== undefined)
      transaction.currency = dto.currency.toUpperCase();
    if (dto.date !== undefined) transaction.date = dto.date;
    if (dto.description !== undefined)
      transaction.description = dto.description.trim();
    if (dto.notes !== undefined) transaction.notes = dto.notes?.trim() || null;

    return toTransactionResponse(
      await this.transactionsRepository.save(transaction),
    );
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const transaction = await this.findOwnedTransaction(userId, id);
    if (transaction.transferGroupId) {
      await this.transactionsRepository.delete({
        userId,
        transferGroupId: transaction.transferGroupId,
      });
      return;
    }
    await this.transactionsRepository.delete({ id, userId });
  }

  private async createTransfer(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
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
    const destinationAccount = await this.assertAccountUsable(
      userId,
      dto.transferAccountId,
    );
    this.assertCurrencyMatches(destinationAccount, dto.currency);

    const transferGroupId = randomUUID();
    const amount = Math.abs(dto.amount);
    const outbound = this.transactionsRepository.create({
      userId,
      type: "transfer",
      amount: -amount,
      currency: dto.currency.toUpperCase(),
      date: dto.date,
      description: dto.description.trim(),
      notes: dto.notes?.trim() || null,
      accountId: dto.accountId,
      transferAccountId: dto.transferAccountId,
      categoryId: null,
      transferGroupId,
    });
    const inbound = this.transactionsRepository.create({
      ...outbound,
      id: undefined,
      amount,
      accountId: dto.transferAccountId,
      transferAccountId: dto.accountId,
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.save(outbound);
      await manager.save(inbound);
    });

    return toTransactionResponse(outbound);
  }

  private async updateTransfer(
    userId: string,
    transaction: Transaction,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const group = await this.transactionsRepository.find({
      where: { userId, transferGroupId: transaction.transferGroupId ?? "" },
    });
    if (group.length < 2) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El movimiento no existe",
      );
    }

    const outbound = group.find((item) => item.amount < 0) ?? group[0];
    const inbound = group.find((item) => item.id !== outbound.id) ?? group[1];

    const origin = dto.accountId ?? outbound.accountId;
    const destination = dto.transferAccountId ?? inbound.accountId;
    if (origin === destination) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Las cuentas deben ser distintas",
        { transferAccountId: ["Debe ser distinta de la cuenta origen"] },
      );
    }
    const currency = (dto.currency ?? outbound.currency).toUpperCase();
    const [originAccount, destinationAccount] = await Promise.all([
      this.assertAccountUsable(userId, origin),
      this.assertAccountUsable(userId, destination),
    ]);
    this.assertCurrencyMatches(originAccount, currency);
    this.assertCurrencyMatches(destinationAccount, currency);

    const amount =
      dto.amount !== undefined
        ? Math.abs(dto.amount)
        : Math.abs(outbound.amount);

    outbound.accountId = origin;
    outbound.transferAccountId = destination;
    outbound.amount = -amount;
    inbound.accountId = destination;
    inbound.transferAccountId = origin;
    inbound.amount = amount;

    for (const leg of [outbound, inbound]) {
      if (dto.currency !== undefined) leg.currency = dto.currency.toUpperCase();
      if (dto.date !== undefined) leg.date = dto.date;
      if (dto.description !== undefined)
        leg.description = dto.description.trim();
      if (dto.notes !== undefined) leg.notes = dto.notes?.trim() || null;
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.save(outbound);
      await manager.save(inbound);
    });

    return toTransactionResponse(outbound);
  }

  private async findOwnedTransaction(
    userId: string,
    id: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOneBy({
      id,
      userId,
    });
    if (!transaction) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El movimiento no existe",
      );
    }
    return transaction;
  }

  private async assertAccountUsable(
    userId: string,
    accountId: string,
  ): Promise<Account> {
    const account = await this.accountsRepository.findOneBy({
      id: accountId,
      userId,
    });
    if (!account) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La cuenta no existe",
      );
    }
    if (account.archived) {
      throw new ApiException(
        ErrorCode.ACCOUNT_ARCHIVED,
        HttpStatus.CONFLICT,
        "La cuenta está archivada",
      );
    }
    return account;
  }

  private assertCurrencyMatches(account: Account, currency: string): void {
    if (account.currency.toUpperCase() !== currency.toUpperCase()) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "La moneda del movimiento debe coincidir con la de la cuenta",
        { currency: ["Debe coincidir con la moneda de la cuenta"] },
      );
    }
  }

  private async assertCategoryUsable(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.categoriesRepository.findOneBy({
      id: categoryId,
    });
    if (!category || (category.userId !== userId && category.userId !== null)) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La categoría no existe",
      );
    }
  }
}

import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { DataSource, In, Repository } from "typeorm";
import { Paginated } from "../common/dto/pagination.dto";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
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

  async listOwnedTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({ where: { userId } });
  }

  async expensesByCategoryMonth(
    userId: string,
    months: string[],
    categoryIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (months.length === 0 || categoryIds.length === 0) return result;

    const transactions = await this.transactionsRepository.find({
      where: { userId, type: "expense", categoryId: In(categoryIds) },
      select: ["categoryId", "amount", "date"],
    });
    const monthSet = new Set(months);
    for (const transaction of transactions) {
      if (!transaction.categoryId) continue;
      const month = transaction.date.slice(0, 7);
      if (!monthSet.has(month)) continue;
      const key = `${transaction.categoryId}:${month}`;
      result.set(key, (result.get(key) ?? 0) + transaction.amount);
    }
    return result;
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
    if (dto.type === "transfer") {
      return this.createTransfer(userId, dto);
    }

    if (!dto.categoryId) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Elegí una categoría",
        { categoryId: ["La categoría es obligatoria para ingresos y gastos"] },
      );
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

    if (dto.accountId) transaction.accountId = dto.accountId;
    if (dto.categoryId !== undefined) transaction.categoryId = dto.categoryId;
    if (dto.type !== undefined) transaction.type = dto.type;
    if (transaction.type !== "transfer" && !transaction.categoryId) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "Elegí una categoría",
        { categoryId: ["La categoría es obligatoria para ingresos y gastos"] },
      );
    }
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
}

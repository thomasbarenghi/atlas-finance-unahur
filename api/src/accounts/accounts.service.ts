import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Transaction } from "../transactions/entities/transaction.entity";
import { AccountResponseDto } from "./dto/account-response.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { Account } from "./entities/account.entity";

const signedAmount = (transaction: Transaction): number =>
  transaction.type === "expense" ? -transaction.amount : transaction.amount;

const toAccountResponse = (
  account: Account,
  currentBalance: number,
): AccountResponseDto => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  initialBalance: account.initialBalance,
  currentBalance,
  archived: account.archived,
  notes: account.notes,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
});

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async listAccounts(userId: string): Promise<AccountResponseDto[]> {
    const [accounts, transactions] = await Promise.all([
      this.accountsRepository.find({
        where: { userId },
        order: { createdAt: "ASC" },
      }),
      this.transactionsRepository.find({
        where: { userId },
        select: ["accountId", "type", "amount"],
      }),
    ]);

    const totals = new Map<string, number>();
    for (const transaction of transactions) {
      totals.set(
        transaction.accountId,
        (totals.get(transaction.accountId) ?? 0) + signedAmount(transaction),
      );
    }

    return accounts.map((account) =>
      toAccountResponse(
        account,
        account.initialBalance + (totals.get(account.id) ?? 0),
      ),
    );
  }

  async getAccount(userId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    return toAccountResponse(account, await this.balanceOf(userId, account));
  }

  async createAccount(
    userId: string,
    dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = this.accountsRepository.create({
      userId,
      name: dto.name.trim(),
      type: dto.type,
      currency: dto.currency.toUpperCase(),
      initialBalance: dto.initialBalance ?? 0,
      notes: dto.notes?.trim() || null,
    });
    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(saved, saved.initialBalance);
  }

  async updateAccount(
    userId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);

    if (dto.name !== undefined) account.name = dto.name.trim();
    if (dto.type !== undefined) account.type = dto.type;
    if (dto.currency !== undefined)
      account.currency = dto.currency.toUpperCase();
    if (dto.initialBalance !== undefined) {
      account.initialBalance = dto.initialBalance;
    }
    if (dto.notes !== undefined) account.notes = dto.notes?.trim() || null;

    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(saved, await this.balanceOf(userId, saved));
  }

  async archiveAccount(
    userId: string,
    id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    account.archived = true;
    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(saved, await this.balanceOf(userId, saved));
  }

  async restoreAccount(
    userId: string,
    id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    account.archived = false;
    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(saved, await this.balanceOf(userId, saved));
  }

  async assertAccountUsable(
    userId: string,
    id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.getAccount(userId, id);
    if (account.archived) {
      throw new ApiException(
        ErrorCode.ACCOUNT_ARCHIVED,
        HttpStatus.CONFLICT,
        "La cuenta está archivada",
      );
    }
    return account;
  }

  private async balanceOf(userId: string, account: Account): Promise<number> {
    const transactions = await this.transactionsRepository.find({
      where: { userId, accountId: account.id },
      select: ["type", "amount"],
    });
    return transactions.reduce(
      (total, transaction) => total + signedAmount(transaction),
      account.initialBalance,
    );
  }

  private async findOwnedAccount(userId: string, id: string): Promise<Account> {
    const account = await this.accountsRepository.findOneBy({ id, userId });
    if (!account) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La cuenta no existe",
      );
    }
    return account;
  }
}

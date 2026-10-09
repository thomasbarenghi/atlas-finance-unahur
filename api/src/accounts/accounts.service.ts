import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AccountBalancesService } from "../shared/account-balances/account-balances.service";
import { AccountResponseDto } from "./dto/account-response.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { Account } from "./entities/account.entity";

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
    private readonly balances: AccountBalancesService,
  ) {}

  async listAccounts(userId: string): Promise<AccountResponseDto[]> {
    const accounts = await this.accountsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    const totals = await this.balances.signedTotalsByAccount(userId);
    return accounts.map((account) =>
      toAccountResponse(
        account,
        account.initialBalance + (totals.get(account.id) ?? 0),
      ),
    );
  }

  async listOwnedAccounts(userId: string): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
  }

  async getAccount(userId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    return toAccountResponse(
      account,
      await this.balances.currentBalanceOf(account, userId),
    );
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
    return toAccountResponse(
      saved,
      await this.balances.currentBalanceOf(saved, userId),
    );
  }

  async archiveAccount(
    userId: string,
    id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    account.archived = true;
    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(
      saved,
      await this.balances.currentBalanceOf(saved, userId),
    );
  }

  async restoreAccount(
    userId: string,
    id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.findOwnedAccount(userId, id);
    account.archived = false;
    const saved = await this.accountsRepository.save(account);
    return toAccountResponse(
      saved,
      await this.balances.currentBalanceOf(saved, userId),
    );
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

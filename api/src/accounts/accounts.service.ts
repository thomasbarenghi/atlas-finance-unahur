import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { Account } from "./entities/account.entity";
import { AccountResponseDto } from "./dto/account-response.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

const toAccountResponse = (account: Account): AccountResponseDto => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  initialBalance: account.initialBalance,
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
  ) {}

  async listAccounts(userId: string): Promise<AccountResponseDto[]> {
    const accounts = await this.accountsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return accounts.map(toAccountResponse);
  }

  async getAccount(userId: string, id: string): Promise<AccountResponseDto> {
    const account = await this.accountsRepository.findOneBy({ id, userId });
    if (!account) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La cuenta no existe",
      );
    }
    return toAccountResponse(account);
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
    return toAccountResponse(await this.accountsRepository.save(account));
  }

  async updateAccount(
    userId: string,
    id: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsRepository.findOneBy({ id, userId });
    if (!account) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La cuenta no existe",
      );
    }

    if (dto.name !== undefined) account.name = dto.name.trim();
    if (dto.type !== undefined) account.type = dto.type;
    if (dto.currency !== undefined)
      account.currency = dto.currency.toUpperCase();
    if (dto.initialBalance !== undefined) {
      account.initialBalance = dto.initialBalance;
    }
    if (dto.notes !== undefined) account.notes = dto.notes.trim() || null;

    return toAccountResponse(await this.accountsRepository.save(account));
  }
}

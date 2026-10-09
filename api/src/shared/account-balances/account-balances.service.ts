import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";

const signedAmount = (transaction: Transaction): number =>
  transaction.type === "expense" ? -transaction.amount : transaction.amount;

/**
 * Read model shared by the accounts and dashboard domains to derive the
 * current balance of an account from its transactions (FR-CUE-004). It is a
 * cross-domain provider (allowed in `shared/`) so that neither `AccountsService`
 * nor the dashboard orchestrator needs to import the transactions repository.
 */
@Injectable()
export class AccountBalancesService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async currentBalanceOf(account: Account, userId: string): Promise<number> {
    const transactions = await this.transactionsRepository.find({
      where: { userId, accountId: account.id },
      select: ["type", "amount"],
    });
    return transactions.reduce(
      (total, transaction) => total + signedAmount(transaction),
      account.initialBalance,
    );
  }

  async signedTotalsByAccount(userId: string): Promise<Map<string, number>> {
    const transactions = await this.transactionsRepository.find({
      where: { userId },
      select: ["accountId", "type", "amount"],
    });
    const totals = new Map<string, number>();
    for (const transaction of transactions) {
      totals.set(
        transaction.accountId,
        (totals.get(transaction.accountId) ?? 0) + signedAmount(transaction),
      );
    }
    return totals;
  }
}

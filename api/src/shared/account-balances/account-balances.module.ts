import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { AccountBalancesService } from "./account-balances.service";

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [AccountBalancesService],
  exports: [AccountBalancesService],
})
export class AccountBalancesModule {}

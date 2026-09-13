import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../transactions/entities/transaction.entity";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { Account } from "./entities/account.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

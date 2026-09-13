import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "../accounts/entities/account.entity";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { BudgetsModule } from "../budgets/budgets.module";
import { Category } from "../categories/entities/category.entity";
import { Debt } from "../debts/entities/debt.entity";
import { FxModule } from "../fx/fx.module";
import { Position } from "../positions/entities/position.entity";
import { Quote } from "../quotes/entities/quote.entity";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Account,
      Transaction,
      Category,
      Asset,
      Valuation,
      Debt,
      Position,
      Quote,
    ]),
    CalculationsModule,
    FxModule,
    BudgetsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

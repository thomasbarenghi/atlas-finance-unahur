import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Transaction } from "../transactions/entities/transaction.entity";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { Budget } from "./entities/budget.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, Transaction, Category]),
    CalculationsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}

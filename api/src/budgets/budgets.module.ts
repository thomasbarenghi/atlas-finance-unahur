import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { BudgetsController } from "./budgets.controller";
import { BudgetsOrchestrator } from "./budgets.orchestrator";
import { BudgetsService } from "./budgets.service";
import { Budget } from "./entities/budget.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget]),
    CalculationsModule,
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsOrchestrator],
  exports: [BudgetsService, BudgetsOrchestrator],
})
export class BudgetsModule {}

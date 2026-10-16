import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { CategoriesModule } from "../categories/categories.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardOrchestrator } from "./dashboard.orchestrator";

@Module({
  imports: [
    CalculationsModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardOrchestrator],
  exports: [DashboardOrchestrator],
})
export class DashboardModule {}

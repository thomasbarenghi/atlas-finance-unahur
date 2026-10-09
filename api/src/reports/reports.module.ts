import { Module } from "@nestjs/common";
import { BudgetsModule } from "../budgets/budgets.module";
import { CategoriesModule } from "../categories/categories.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { FxModule } from "../fx/fx.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { UsersModule } from "../users/users.module";
import { ReportsController } from "./reports.controller";
import { ReportsOrchestrator } from "./reports.orchestrator";

@Module({
  imports: [
    DashboardModule,
    BudgetsModule,
    TransactionsModule,
    CategoriesModule,
    UsersModule,
    FxModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsOrchestrator],
  exports: [ReportsOrchestrator],
})
export class ReportsModule {}

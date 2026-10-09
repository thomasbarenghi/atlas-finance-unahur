import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { AssetsModule } from "../assets/assets.module";
import { BudgetsModule } from "../budgets/budgets.module";
import { CategoriesModule } from "../categories/categories.module";
import { DebtsModule } from "../debts/debts.module";
import { FxModule } from "../fx/fx.module";
import { PositionsModule } from "../positions/positions.module";
import { QuotesModule } from "../quotes/quotes.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { UsersModule } from "../users/users.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardOrchestrator } from "./dashboard.orchestrator";

@Module({
  imports: [
    CalculationsModule,
    FxModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    AssetsModule,
    DebtsModule,
    PositionsModule,
    QuotesModule,
    BudgetsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardOrchestrator],
  exports: [DashboardOrchestrator],
})
export class DashboardModule {}

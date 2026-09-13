import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountsModule } from "../accounts/accounts.module";
import { Account } from "../accounts/entities/account.entity";
import { AssetsModule } from "../assets/assets.module";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { BudgetsModule } from "../budgets/budgets.module";
import { Budget } from "../budgets/entities/budget.entity";
import { CategoriesModule } from "../categories/categories.module";
import { Category } from "../categories/entities/category.entity";
import { DashboardModule } from "../dashboard/dashboard.module";
import { DebtsModule } from "../debts/debts.module";
import { Debt } from "../debts/entities/debt.entity";
import { GoalsModule } from "../goals/goals.module";
import { PositionsModule } from "../positions/positions.module";
import { Position } from "../positions/entities/position.entity";
import { QuotesModule } from "../quotes/quotes.module";
import { ReportsModule } from "../reports/reports.module";
import { AiModule } from "../shared/ai/ai.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Transaction } from "../transactions/entities/transaction.entity";
import { TransactionsModule } from "../transactions/transactions.module";
import { User } from "../users/entities/user.entity";
import { UsersModule } from "../users/users.module";
import { PendingActionsService } from "./actions/pending-actions.service";
import { AssistantContextService } from "./assistant-context.service";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { AccountTools } from "./tools/domains/account.tools";
import { AssetTools } from "./tools/domains/asset.tools";
import { BudgetTools } from "./tools/domains/budget.tools";
import { CategoryTools } from "./tools/domains/category.tools";
import { DebtTools } from "./tools/domains/debt.tools";
import { GoalTools } from "./tools/domains/goal.tools";
import { InsightTools } from "./tools/domains/insight.tools";
import { PositionTools } from "./tools/domains/position.tools";
import { ProfileTools } from "./tools/domains/profile.tools";
import { TransactionTools } from "./tools/domains/transaction.tools";
import { ReferenceResolver } from "./tools/reference-resolver.service";
import { ToolRegistry } from "./tools/tool-registry.service";
import { AiConversation } from "./entities/ai-conversation.entity";
import { AssistantAction } from "./entities/assistant-action.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
      AssistantAction,
      User,
      Transaction,
      Category,
      Budget,
      Asset,
      Valuation,
      Debt,
      Position,
      Account,
    ]),
    AiModule,
    CalculationsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    AssetsModule,
    DebtsModule,
    PositionsModule,
    GoalsModule,
    UsersModule,
    DashboardModule,
    ReportsModule,
    QuotesModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantContextService,
    PendingActionsService,
    ReferenceResolver,
    ToolRegistry,
    AccountTools,
    CategoryTools,
    TransactionTools,
    BudgetTools,
    AssetTools,
    DebtTools,
    PositionTools,
    GoalTools,
    ProfileTools,
    InsightTools,
  ],
})
export class AssistantModule {}

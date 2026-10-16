import { Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { CategoriesModule } from "../categories/categories.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { AiModule } from "../shared/ai/ai.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { UsersModule } from "../users/users.module";
import { AssistantContextService } from "./assistant-context.service";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";

@Module({
  imports: [
    AiModule,
    CalculationsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    DashboardModule,
    UsersModule,
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantContextService],
})
export class AssistantModule {}

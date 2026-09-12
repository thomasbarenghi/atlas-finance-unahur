import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "../accounts/entities/account.entity";
import { Asset } from "../assets/entities/asset.entity";
import { Valuation } from "../assets/entities/valuation.entity";
import { Budget } from "../budgets/entities/budget.entity";
import { Category } from "../categories/entities/category.entity";
import { Debt } from "../debts/entities/debt.entity";
import { Position } from "../positions/entities/position.entity";
import { AiModule } from "../shared/ai/ai.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Transaction } from "../transactions/entities/transaction.entity";
import { User } from "../users/entities/user.entity";
import { AssistantContextService } from "./assistant-context.service";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { AiConversation } from "./entities/ai-conversation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConversation,
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
  ],
  controllers: [AssistantController],
  providers: [AssistantService, AssistantContextService],
})
export class AssistantModule {}

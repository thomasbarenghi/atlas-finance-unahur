import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountsModule } from "../accounts/accounts.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Goal } from "./entities/goal.entity";
import { GoalsController } from "./goals.controller";
import { GoalsOrchestrator } from "./goals.orchestrator";
import { GoalsService } from "./goals.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal]),
    AccountsModule,
    CalculationsModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsOrchestrator],
  exports: [GoalsService, GoalsOrchestrator],
})
export class GoalsModule {}

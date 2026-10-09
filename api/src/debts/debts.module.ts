import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetsModule } from "../assets/assets.module";
import { DebtsController } from "./debts.controller";
import { DebtsOrchestrator } from "./debts.orchestrator";
import { DebtsService } from "./debts.service";
import { Debt } from "./entities/debt.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), AssetsModule],
  controllers: [DebtsController],
  providers: [DebtsService, DebtsOrchestrator],
  exports: [DebtsService, DebtsOrchestrator],
})
export class DebtsModule {}

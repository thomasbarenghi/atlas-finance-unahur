import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuotesModule } from "../quotes/quotes.module";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { CurrencyModule } from "../shared/currency/currency.module";
import { Position } from "./entities/position.entity";
import { PositionsController } from "./positions.controller";
import { PositionsOrchestrator } from "./positions.orchestrator";
import { PositionsService } from "./positions.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Position]),
    QuotesModule,
    CalculationsModule,
    CurrencyModule,
  ],
  controllers: [PositionsController],
  providers: [PositionsService, PositionsOrchestrator],
  exports: [PositionsService, PositionsOrchestrator],
})
export class PositionsModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Quote } from "../quotes/entities/quote.entity";
import { CalculationsModule } from "../shared/calculations/calculations.module";
import { Position } from "./entities/position.entity";
import { PositionsController } from "./positions.controller";
import { PositionsService } from "./positions.service";

@Module({
  imports: [TypeOrmModule.forFeature([Position, Quote]), CalculationsModule],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}

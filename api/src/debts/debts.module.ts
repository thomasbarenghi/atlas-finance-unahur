import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Asset } from "../assets/entities/asset.entity";
import { DebtsController } from "./debts.controller";
import { DebtsService } from "./debts.service";
import { Debt } from "./entities/debt.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Debt, Asset])],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}

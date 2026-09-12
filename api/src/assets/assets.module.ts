import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Debt } from "../debts/entities/debt.entity";
import { AssetsController } from "./assets.controller";
import { AssetsService } from "./assets.service";
import { Asset } from "./entities/asset.entity";
import { Valuation } from "./entities/valuation.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Valuation, Debt])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}

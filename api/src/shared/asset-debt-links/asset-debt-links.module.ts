import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Debt } from "../../debts/entities/debt.entity";
import { AssetDebtLinksService } from "./asset-debt-links.service";

@Module({
  imports: [TypeOrmModule.forFeature([Debt])],
  providers: [AssetDebtLinksService],
  exports: [AssetDebtLinksService],
})
export class AssetDebtLinksModule {}

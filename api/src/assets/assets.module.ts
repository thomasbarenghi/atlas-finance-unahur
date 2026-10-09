import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetDebtLinksModule } from "../shared/asset-debt-links/asset-debt-links.module";
import { CurrencyModule } from "../shared/currency/currency.module";
import { AssetsController } from "./assets.controller";
import { AssetsService } from "./assets.service";
import { Asset } from "./entities/asset.entity";
import { Valuation } from "./entities/valuation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Valuation]),
    AssetDebtLinksModule,
    CurrencyModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}

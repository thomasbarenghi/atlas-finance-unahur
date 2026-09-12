import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FxModule } from "../../fx/fx.module";
import { PositionsModule } from "../../positions/positions.module";
import { QuotesModule } from "../../quotes/quotes.module";
import { MarketController } from "./market.controller";
import { MarketScheduler } from "./market-scheduler.service";
import { MarketService } from "./market.service";
import { CryptoQuoteProvider } from "./providers/crypto-quote.provider";
import { FxRateProvider } from "./providers/fx-rate.provider";

@Module({
  imports: [ConfigModule, QuotesModule, FxModule, PositionsModule],
  controllers: [MarketController],
  providers: [
    CryptoQuoteProvider,
    FxRateProvider,
    MarketService,
    MarketScheduler,
  ],
  exports: [MarketService],
})
export class MarketModule {}

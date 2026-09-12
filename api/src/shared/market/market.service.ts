import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../../config/configuration";
import { FxService } from "../../fx/fx.service";
import { PositionsService } from "../../positions/positions.service";
import { QuotesService } from "../../quotes/quotes.service";
import { MarketRefreshOutcome, MarketRefreshResult } from "./market.types";
import { CryptoQuoteProvider } from "./providers/crypto-quote.provider";
import { FxRateProvider } from "./providers/fx-rate.provider";

@Injectable()
export class MarketService {
  private readonly logger = new Logger("MarketService");

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly cryptoQuoteProvider: CryptoQuoteProvider,
    private readonly fxRateProvider: FxRateProvider,
    private readonly quotesService: QuotesService,
    private readonly fxService: FxService,
    private readonly positionsService: PositionsService,
  ) {}

  async refresh(): Promise<MarketRefreshResult> {
    const market = this.config.get("market", { infer: true });
    const currencies = [
      ...new Set([
        ...this.config.get("supportedCurrencies", { infer: true }),
        market.vsCurrency,
      ]),
    ];

    const [crypto, fx] = await Promise.all([
      this.refreshCrypto(market.symbols),
      this.refreshFx(currencies),
    ]);

    return { refreshedAt: new Date().toISOString(), crypto, fx };
  }

  private async refreshCrypto(
    configuredSymbols: string[],
  ): Promise<MarketRefreshOutcome> {
    try {
      const tracked = await this.positionsService.listDistinctSymbols();
      const symbols = [
        ...new Set(
          [...configuredSymbols, ...tracked].map((s) => s.toUpperCase()),
        ),
      ];
      const quotes = await this.cryptoQuoteProvider.fetchQuotes(symbols);
      const updated = await this.quotesService.upsertQuotes(quotes);
      this.logger.log(`Crypto quotes refreshed: ${updated}`);
      return { updated, error: null };
    } catch (error) {
      return this.failure("crypto", error);
    }
  }

  private async refreshFx(currencies: string[]): Promise<MarketRefreshOutcome> {
    try {
      const rates = await this.fxRateProvider.fetchRates(currencies);
      const updated = await this.fxService.upsertRates(rates);
      this.logger.log(`Exchange rates refreshed: ${updated}`);
      return { updated, error: null };
    } catch (error) {
      return this.failure("fx", error);
    }
  }

  private failure(scope: string, error: unknown): MarketRefreshOutcome {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    this.logger.warn(`${scope} refresh failed: ${message}`);
    return { updated: 0, error: message };
  }
}

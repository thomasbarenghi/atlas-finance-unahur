import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { AppConfig } from "../../../config/configuration";
import { ProviderQuote } from "../market.types";
import { binancePairFor, isSupportedCryptoSymbol } from "./crypto-symbols";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

const QUOTE_ASSET = "USDT";

@Injectable()
export class CryptoQuoteProvider {
  private readonly logger = new Logger("CryptoQuoteProvider");

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async fetchQuotes(symbols: string[]): Promise<ProviderQuote[]> {
    const market = this.config.get("market", { infer: true });
    const codes = [
      ...new Set(
        symbols
          .map((symbol) => symbol.toUpperCase())
          .filter((code) => isSupportedCryptoSymbol(code)),
      ),
    ];
    if (codes.length === 0) return [];

    const results = await Promise.all(
      codes.map((code) =>
        this.fetchSymbol(code, market).catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "unknown error";
          this.logger.warn(`No quote for ${code}: ${message}`);
          return null;
        }),
      ),
    );

    return results.filter((quote): quote is ProviderQuote => quote !== null);
  }

  private async fetchSymbol(
    code: string,
    market: AppConfig["market"],
  ): Promise<ProviderQuote | null> {
    if (code === QUOTE_ASSET) {
      return {
        symbol: code,
        price: 1,
        currency: market.vsCurrency,
        provider: "binance",
        change24h: null,
      };
    }

    const response = await axios.get<BinanceTicker>(
      `${market.cryptoUrl}/ticker/24hr`,
      {
        params: { symbol: binancePairFor(code, QUOTE_ASSET) },
        timeout: market.timeoutMs,
      },
    );

    const price = Number(response.data.lastPrice);
    if (!Number.isFinite(price)) {
      this.logger.warn(`No price for ${code}`);
      return null;
    }
    const change = Number(response.data.priceChangePercent);
    return {
      symbol: code,
      price,
      currency: market.vsCurrency,
      provider: "binance",
      change24h: Number.isFinite(change) ? change : null,
    };
  }
}

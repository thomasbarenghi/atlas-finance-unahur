import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { CURRENCY_CODES } from "./currency-catalog";

export interface FetchedRates {
  date: string;
  /** ARS per one unit of each supported currency (ARS itself is 1). */
  rates: Record<string, number>;
}

const RATES_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/ars.json";

const REQUEST_TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Public FX provider (Fawaz Ahmed's currency-api). It is only used by the
 * explicit refresh endpoint; `CurrenciesService` keeps the last valid values if
 * the provider is unavailable (FR-MER-004 spirit). The API returns ARS as the
 * base, so each value is inverted to store "ARS per unit".
 */
@Injectable()
export class ExchangeRatesProvider {
  private readonly logger = new Logger(ExchangeRatesProvider.name);
  private cache: (FetchedRates & { fetchedAt: number }) | null = null;

  async fetch(): Promise<FetchedRates | null> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return { date: this.cache.date, rates: this.cache.rates };
    }

    try {
      const response = await axios.get<{
        date?: string;
        ars?: Record<string, number>;
      }>(RATES_URL, { timeout: REQUEST_TIMEOUT_MS });
      const base = response.data.ars;
      if (!base) return null;

      const rates: Record<string, number> = { ARS: 1 };
      for (const code of CURRENCY_CODES) {
        if (code === "ARS") continue;
        const value = base[code.toLowerCase()];
        if (typeof value === "number" && value > 0) {
          rates[code] = 1 / value;
        }
      }

      const result = {
        date: response.data.date ?? new Date().toISOString().slice(0, 10),
        rates,
        fetchedAt: Date.now(),
      };
      this.cache = result;
      return { date: result.date, rates: result.rates };
    } catch (error) {
      this.logger.warn(
        `No se pudieron obtener cotizaciones: ${
          error instanceof Error ? error.message : "error desconocido"
        }`,
      );
      return null;
    }
  }
}

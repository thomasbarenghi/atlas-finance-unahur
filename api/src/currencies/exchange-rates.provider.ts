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

/**
 * Public FX provider (Fawaz Ahmed's currency-api). Quotes are fetched on every
 * read; there is no database or in-memory cache. The API returns ARS as the
 * base, so each value is inverted to expose "ARS per unit".
 */
@Injectable()
export class ExchangeRatesProvider {
  private readonly logger = new Logger(ExchangeRatesProvider.name);

  async fetch(): Promise<FetchedRates | null> {
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

      return {
        date: response.data.date ?? new Date().toISOString().slice(0, 10),
        rates,
      };
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

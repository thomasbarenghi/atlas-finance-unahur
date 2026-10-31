import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { BASE_CURRENCY, CURRENCY_CODES } from "./currency-catalog";

export interface FetchedRates {
  date: string;
  rates: Record<string, number>;
}

type RatesPayload = { date?: string } & Record<string, unknown>;

const RATES_URL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`;

@Injectable()
export class ExchangeRatesProvider {
  private readonly logger = new Logger(ExchangeRatesProvider.name);

  async fetch(): Promise<FetchedRates | null> {
    try {
      const { data } = await axios.get<RatesPayload>(RATES_URL, {
        timeout: 6_000,
        maxRedirects: 0,
      });
      const base = data[BASE_CURRENCY.toLowerCase()] as
        Record<string, number> | undefined;
      if (!base) return null;

      const rates = Object.fromEntries(
        CURRENCY_CODES.map((code): [string, number] => [
          code,
          code === BASE_CURRENCY ? 1 : 1 / base[code.toLowerCase()],
        ]).filter(([, rate]) => Number.isFinite(rate) && rate > 0),
      );

      return {
        date: data.date ?? new Date().toISOString().slice(0, 10),
        rates,
      };
    } catch (error) {
      this.logger.warn(`Error obteniendo cotizaciones: ${String(error)}`);
      return null;
    }
  }
}

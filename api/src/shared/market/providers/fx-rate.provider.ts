import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { AppConfig } from "../../../config/configuration";
import { ProviderRate } from "../market.types";

const PIVOT_CURRENCY = "ARS";
const PIVOT_CODE = PIVOT_CURRENCY.toLowerCase();

interface FawazResponse {
  date?: string;
  [code: string]: unknown;
}

@Injectable()
export class FxRateProvider {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async fetchRates(targetCurrencies: string[]): Promise<ProviderRate[]> {
    const market = this.config.get("market", { infer: true });
    const response = await axios.get<FawazResponse>(
      `${market.fxUrl}/${PIVOT_CODE}.json`,
      { timeout: market.timeoutMs },
    );

    const pivotRates = response.data[PIVOT_CODE] as
      Record<string, number> | undefined;
    if (!pivotRates) {
      throw new Error(
        "El proveedor de cotizaciones no devolvió tipos de cambio",
      );
    }
    const date =
      typeof response.data.date === "string" ? response.data.date : undefined;

    const rates: ProviderRate[] = [];
    const uniqueCurrencies = [
      ...new Set(targetCurrencies.map((currency) => currency.toUpperCase())),
    ];
    for (const code of uniqueCurrencies) {
      if (code === PIVOT_CURRENCY) continue;
      const perPivot = pivotRates[code.toLowerCase()];
      if (typeof perPivot !== "number" || perPivot <= 0) continue;
      rates.push({
        baseCurrency: code,
        quoteCurrency: PIVOT_CURRENCY,
        rate: 1 / perPivot,
        provider: "fawaz",
        date,
      });
    }
    return rates;
  }
}

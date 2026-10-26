import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { User } from "../users/entities/user.entity";
import {
  CURRENCY_CATALOG,
  getCurrency,
  type CurrencyCatalogEntry,
} from "./currency-catalog";
import type {
  CurrencyRateDto,
  CurrencySettingsDto,
} from "./dto/currency-response.dto";
import { CurrencyRate } from "./entities/currency-rate.entity";
import { ExchangeRatesProvider } from "./exchange-rates.provider";

const today = (): string => new Date().toISOString().slice(0, 10);

export interface UserRateContext {
  primaryCurrency: string;
  /** ARS per one unit of every supported currency. */
  rates: Map<string, number>;
  rateDate: string | null;
  /** Last quote date per currency (fallback: `rateDate`). */
  rateDates: Map<string, string>;
}

export interface RefreshRatesResult {
  updated: boolean;
  date: string | null;
}

/**
 * Global currency catalog and API-owned quotes (RN-016). Users never create
 * currencies nor set their rate; the settings screen only displays the quote
 * of the currencies their accounts use. A multi-currency transfer can override
 * the rate for that operation, but the override is not persisted (RN-017).
 *
 * Quotes are stored in ARS (the internal base) and converted to the user's
 * primary currency for display.
 */
@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(CurrencyRate)
    private readonly currencyRatesRepository: Repository<CurrencyRate>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly provider: ExchangeRatesProvider,
  ) {}

  private refreshPromise: Promise<RefreshRatesResult> | null = null;
  private lastRefreshAttempt = 0;

  getCatalog(): CurrencyCatalogEntry[] {
    return CURRENCY_CATALOG;
  }

  async getPrimaryCurrency(userId: string): Promise<string> {
    const user = await this.findUser(userId);
    return user.primaryCurrency || "ARS";
  }

  /**
   * Rate context used by read models. Quotes are API-owned and stored in the
   * global `currency_rates` table; the context is refreshed lazily when stale.
   */
  async getRateContext(userId: string): Promise<UserRateContext> {
    const user = await this.findUser(userId);
    await this.ensureFreshRates();
    const rows = await this.currencyRatesRepository.find();
    const primaryCurrency = user.primaryCurrency || "ARS";
    const rates = new Map<string, number>([["ARS", 1]]);
    for (const row of rows) rates.set(row.currency, row.rate);
    if (!rates.get(primaryCurrency)) rates.set(primaryCurrency, 1);

    const dates = rows
      .map((row) => row.rateDate)
      .filter((date): date is string => Boolean(date))
      .sort();
    return {
      primaryCurrency,
      rates,
      rateDate: dates.at(-1) ?? null,
      rateDates: new Map(rows.map((row) => [row.currency, row.rateDate])),
    };
  }

  /**
   * Quotes displayed in Ajustes. Only currencies used by the user's accounts
   * are returned: the user cannot add a quote manually.
   */
  async getSettings(userId: string): Promise<CurrencySettingsDto> {
    const user = await this.findUser(userId);
    await this.ensureFreshRates();
    const [rows, accountCurrencies] = await Promise.all([
      this.currencyRatesRepository.find(),
      this.listAccountCurrencies(userId),
    ]);
    const primaryCurrency = user.primaryCurrency || "ARS";
    const rateByCurrency = new Map(rows.map((row) => [row.currency, row.rate]));
    const rateFor = (currency: string): number => {
      if (currency === "ARS") return 1;
      return rateByCurrency.get(currency) ?? 1;
    };
    const primaryRate = rateFor(primaryCurrency);
    const dateByCurrency = new Map(
      rows.map((row) => [row.currency, row.rateDate]),
    );
    const sourceByCurrency = new Map(
      rows.map((row) => [row.currency, row.source]),
    );

    const currencies = [...new Set(accountCurrencies)]
      .filter((currency) => currency && currency !== primaryCurrency)
      .sort((first, second) => first.localeCompare(second));

    const result: CurrencyRateDto[] = currencies.map((currency) => {
      const catalog = getCurrency(currency);
      return {
        currency,
        name: catalog?.name ?? currency,
        symbol: catalog?.symbol ?? currency,
        rate: this.roundRate(rateFor(currency) / primaryRate),
        rateDate: dateByCurrency.get(currency) ?? today(),
        source: sourceByCurrency.get(currency) ?? "seed",
      };
    });

    const updatedAt = rows
      .filter((row) => currencies.includes(row.currency))
      .map((row) => row.updatedAt)
      .filter((date): date is Date => Boolean(date))
      .sort((first, second) => second.getTime() - first.getTime())[0];

    return {
      primaryCurrency,
      rates: result,
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
    };
  }

  /**
   * Refreshes the global quotes from the public provider. It is intentionally
   * backend-owned: the client has no endpoint or button to edit rates.
   */
  async refreshRates(): Promise<RefreshRatesResult> {
    const fetched = await this.provider.fetch();
    if (!fetched) return { updated: false, date: null };

    const existing = await this.currencyRatesRepository.find();
    const existingByCurrency = new Map(
      existing.map((row) => [row.currency, row]),
    );
    const rows = CURRENCY_CATALOG.map((entry) => {
      if (entry.code === "ARS") {
        return this.currencyRatesRepository.create({
          currency: "ARS",
          rate: 1,
          rateDate: fetched.date,
          source: "api",
        });
      }
      const fetchedRate = fetched.rates[entry.code];
      const current = existingByCurrency.get(entry.code);
      return this.currencyRatesRepository.create({
        currency: entry.code,
        rate:
          fetchedRate && fetchedRate > 0 ? fetchedRate : (current?.rate ?? 1),
        rateDate: fetched.date,
        source: "api",
      });
    });
    await this.currencyRatesRepository.save(rows);
    return { updated: true, date: fetched.date };
  }

  private async ensureFreshRates(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }
    const now = Date.now();
    if (now - this.lastRefreshAttempt < 60 * 60 * 1000) return;

    const rows = await this.currencyRatesRepository.find();
    const latest = rows
      .map((row) => row.rateDate)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1);
    const stale =
      !latest ||
      now - new Date(`${latest}T00:00:00.000Z`).getTime() > 12 * 60 * 60 * 1000;
    if (!stale) return;

    this.lastRefreshAttempt = now;
    this.refreshPromise = this.refreshRates().finally(() => {
      this.refreshPromise = null;
    });
    await this.refreshPromise;
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El usuario no existe",
      );
    }
    return user;
  }

  private async listAccountCurrencies(userId: string): Promise<string[]> {
    const rows = await this.accountsRepository
      .createQueryBuilder("account")
      .select("DISTINCT account.currency", "currency")
      .where("account.user_id = :userId", { userId })
      .getRawMany<{ currency: string }>();
    return rows.map((row) => row.currency).filter(Boolean);
  }

  private roundRate(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }
}

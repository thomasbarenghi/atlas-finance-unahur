import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Account } from "../accounts/entities/account.entity";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { User } from "../users/entities/user.entity";
import {
  BASE_CURRENCY,
  CURRENCY_CATALOG,
  getCurrency,
  type CurrencyCatalogEntry,
} from "./currency-catalog";
import type {
  CurrencyRateDto,
  CurrencySettingsDto,
} from "./dto/currency-response.dto";
import {
  ExchangeRatesProvider,
  type FetchedRates,
} from "./exchange-rates.provider";

export interface UserRateContext {
  primaryCurrency: string;
  /** Units of the internal base currency per one unit of every supported currency. */
  rates: Map<string, number>;
  rateDate: string | null;
}

/**
 * Global currency catalog and API-owned quotes (RN-002). Users never create
 * currencies nor set their rate; the settings screen only displays the quote
 * of the currencies their accounts use. A multi-currency transfer can override
 * the rate for that operation, but the override is not persisted (FR-TRX-001).
 *
 * Quotes are not persisted: every read fetches them from the public provider.
 * They are stored in the internal base currency and converted to the user's
 * primary currency for display.
 */
@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly provider: ExchangeRatesProvider,
  ) {}

  getCatalog(): CurrencyCatalogEntry[] {
    return CURRENCY_CATALOG;
  }

  /**
   * Rate context used by read models. Quotes are API-owned and fetched for
   * every request; there is no database or in-memory cache.
   */
  async getRateContext(userId: string): Promise<UserRateContext> {
    const [user, fetched] = await Promise.all([
      this.findUser(userId),
      this.fetchRates(),
    ]);
    const primaryCurrency = user.primaryCurrency || BASE_CURRENCY;
    const rates = new Map(Object.entries(fetched.rates));
    if (!rates.has(primaryCurrency)) rates.set(primaryCurrency, 1);

    return {
      primaryCurrency,
      rates,
      rateDate: fetched.date,
    };
  }

  /**
   * Quotes displayed in Ajustes. Only currencies used by the user's accounts
   * are returned: the user cannot add a quote manually.
   */
  async getSettings(userId: string): Promise<CurrencySettingsDto> {
    const [user, fetched, accountCurrencies] = await Promise.all([
      this.findUser(userId),
      this.fetchRates(),
      this.listAccountCurrencies(userId),
    ]);
    const primaryCurrency = user.primaryCurrency || BASE_CURRENCY;
    const rateFor = (currency: string): number => fetched.rates[currency] ?? 1;
    const primaryRate = rateFor(primaryCurrency);

    const currencies = [...new Set(accountCurrencies)]
      .filter((currency) => currency && currency !== primaryCurrency)
      .sort((first, second) => first.localeCompare(second));

    const rates: CurrencyRateDto[] = currencies.map((currency) => {
      const catalog = getCurrency(currency);
      return {
        currency,
        name: catalog?.name ?? currency,
        symbol: catalog?.symbol ?? currency,
        rate: this.roundRate(rateFor(currency) / primaryRate),
        rateDate: fetched.date,
        source: "api",
      };
    });

    return {
      primaryCurrency,
      rates,
      updatedAt: new Date().toISOString(),
    };
  }

  private async fetchRates(): Promise<FetchedRates> {
    const fetched = await this.provider.fetch();
    if (!fetched) {
      throw new ApiException(
        ErrorCode.EXCHANGE_RATES_UNAVAILABLE,
        HttpStatus.BAD_GATEWAY,
        "No se pudieron obtener las cotizaciones de la API",
      );
    }
    return fetched;
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

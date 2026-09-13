import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExchangeRate } from "./entities/exchange-rate.entity";

const PIVOT_CURRENCY = "ARS";
const DEFAULT_PROVIDER = "default";

export type FxConverter = (amount: number, from: string, to: string) => number;

export interface FxRateUpsert {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  provider: string;
  date?: string;
}

interface DefaultRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
}

const DEFAULT_RATES: DefaultRate[] = [
  { baseCurrency: "USD", quoteCurrency: "ARS", rate: 1000 },
  { baseCurrency: "EUR", quoteCurrency: "ARS", rate: 1100 },
  { baseCurrency: "BRL", quoteCurrency: "ARS", rate: 200 },
  { baseCurrency: "UYU", quoteCurrency: "ARS", rate: 25 },
];

@Injectable()
export class FxService implements OnModuleInit {
  private readonly logger = new Logger("FxService");

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly ratesRepository: Repository<ExchangeRate>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.ratesRepository.count();
    if (count > 0) return;
    const today = new Date().toISOString().slice(0, 10);
    await this.ratesRepository.save(
      DEFAULT_RATES.map((rate) =>
        this.ratesRepository.create({
          ...rate,
          provider: DEFAULT_PROVIDER,
          date: today,
        }),
      ),
    );
    this.logger.log("Seeded default exchange rates");
  }

  async getConverter(): Promise<FxConverter> {
    const rates = await this.ratesRepository.find({
      order: { date: "ASC", createdAt: "ASC" },
    });
    const latest = new Map<string, ExchangeRate>();
    for (const rate of rates) {
      latest.set(`${rate.baseCurrency}:${rate.quoteCurrency}`, rate);
    }

    const directRate = (from: string, to: string): number | null => {
      if (from === to) return 1;
      const direct = latest.get(`${from}:${to}`);
      if (direct) return direct.rate;
      const inverse = latest.get(`${to}:${from}`);
      if (inverse && inverse.rate !== 0) return 1 / inverse.rate;
      return null;
    };

    const rateToPivot = (currency: string): number | null => {
      if (currency === PIVOT_CURRENCY) return 1;
      const rate = latest.get(`${currency}:${PIVOT_CURRENCY}`);
      return rate ? rate.rate : null;
    };

    return (amount: number, from: string, to: string): number => {
      const source = from.toUpperCase();
      const target = to.toUpperCase();
      if (source === target) return amount;
      const direct = directRate(source, target);
      if (direct !== null) return amount * direct;
      const sourcePivot = rateToPivot(source);
      const targetPivot = rateToPivot(target);
      if (sourcePivot !== null && targetPivot !== null && targetPivot !== 0) {
        return (amount * sourcePivot) / targetPivot;
      }
      return amount;
    };
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    const converter = await this.getConverter();
    return converter(amount, from, to);
  }

  async upsertRates(rates: FxRateUpsert[]): Promise<number> {
    if (rates.length === 0) return 0;
    const today = new Date().toISOString().slice(0, 10);
    await this.ratesRepository.upsert(
      rates.map((rate) => ({
        baseCurrency: rate.baseCurrency.toUpperCase(),
        quoteCurrency: rate.quoteCurrency.toUpperCase(),
        rate: rate.rate,
        provider: rate.provider,
        date: rate.date ?? today,
      })),
      ["baseCurrency", "quoteCurrency", "provider", "date"],
    );
    return rates.length;
  }
}

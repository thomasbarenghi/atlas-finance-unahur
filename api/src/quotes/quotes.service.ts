import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { AppConfig } from "../config/configuration";
import { Quote } from "./entities/quote.entity";

export interface QuoteResponseDto {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h: number | null;
  fetchedAt: string;
  isStale: boolean;
}

export interface QuoteUpsert {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h?: number | null;
}

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async listQuotes(): Promise<QuoteResponseDto[]> {
    const quotes = await this.quotesRepository.find({
      order: { symbol: "ASC" },
    });
    const staleMs = this.config.get("market", { infer: true }).quoteStaleMs;
    const now = Date.now();
    return this.latestPerPair(quotes).map((quote) => ({
      symbol: quote.symbol,
      price: quote.price,
      currency: quote.currency,
      provider: quote.provider,
      change24h: quote.change24h,
      fetchedAt: quote.fetchedAt.toISOString(),
      isStale: now - quote.fetchedAt.getTime() > staleMs,
    }));
  }

  async upsertQuotes(quotes: QuoteUpsert[]): Promise<number> {
    if (quotes.length === 0) return 0;
    const fetchedAt = new Date();
    const rows = quotes.map((quote) => ({
      symbol: quote.symbol.toUpperCase(),
      price: quote.price,
      currency: quote.currency.toUpperCase(),
      provider: quote.provider,
      change24h: quote.change24h ?? null,
      fetchedAt,
    }));
    await this.quotesRepository.manager.transaction(async (manager) => {
      for (const row of rows) {
        await manager.delete(Quote, {
          symbol: row.symbol,
          currency: row.currency,
          provider: Not(row.provider),
        });
      }
      await manager.upsert(Quote, rows, ["symbol", "currency", "provider"]);
    });
    return rows.length;
  }

  private latestPerPair(quotes: Quote[]): Quote[] {
    const latest = new Map<string, Quote>();
    for (const quote of quotes) {
      const key = `${quote.symbol}:${quote.currency}`;
      const current = latest.get(key);
      if (!current || quote.fetchedAt > current.fetchedAt) {
        latest.set(key, quote);
      }
    }
    return [...latest.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol),
    );
  }
}

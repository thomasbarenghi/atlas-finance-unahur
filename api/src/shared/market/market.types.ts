import { ApiProperty } from "@nestjs/swagger";

export interface ProviderQuote {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h: number | null;
}

export interface ProviderRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  provider: string;
  date?: string;
}

export class MarketRefreshOutcome {
  @ApiProperty({ example: 6 })
  updated: number;

  @ApiProperty({ type: String, nullable: true, example: null })
  error: string | null;
}

export class MarketRefreshResult {
  @ApiProperty({ example: "2026-10-09T16:00:00.000Z" })
  refreshedAt: string;

  @ApiProperty({ type: () => MarketRefreshOutcome })
  crypto: MarketRefreshOutcome;

  @ApiProperty({ type: () => MarketRefreshOutcome })
  fx: MarketRefreshOutcome;
}

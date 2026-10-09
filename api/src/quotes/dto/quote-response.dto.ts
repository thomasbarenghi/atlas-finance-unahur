export class QuoteResponseDto {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h: number | null;
  fetchedAt: string;
  isStale: boolean;
}

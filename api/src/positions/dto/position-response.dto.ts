export interface PositionResponseDto {
  id: string;
  symbol: string;
  instrument: string;
  quantity: number;
  avgCost: number;
  currency: string;
  currentPrice: number | null;
  currentValue: number | null;
  costBasis: number;
  profitLoss: number | null;
  profitLossPct: number | null;
  quoteDate: string | null;
  quoteProvider: string | null;
  isStale: boolean;
}

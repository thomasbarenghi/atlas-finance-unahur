import { AssetType, ValuationSource } from "../../common/types/financial-enums";

export class ValuationResponseDto {
  id: string;
  assetId: string;
  value: number;
  currency: string;
  date: string;
  source: ValuationSource;
  createdAt: string;
}

export class AssetResponseDto {
  id: string;
  name: string;
  type: AssetType;
  currency: string;
  currentValue: number;
  valuationDate: string;
  archived: boolean;
  notes: string | null;
  debtId: string | null;
  createdAt: string;
  updatedAt: string;
}

import {
  Banknote,
  Car,
  Coins,
  House,
  LineChart,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { AssetType } from "@/lib/api/types";

export const ASSET_TYPE_ICONS: Record<AssetType, LucideIcon> = {
  property: House,
  vehicle: Car,
  cash: Banknote,
  investment: LineChart,
  crypto: Coins,
  other: Package,
};

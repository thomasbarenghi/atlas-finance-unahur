import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type PatrimonyHeroVariant = "default" | "negative";

export interface PatrimonyHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  value: number;
  currency: string;
  variant?: PatrimonyHeroVariant;
  badge?: ReactNode;
  supportingText?: string;
}

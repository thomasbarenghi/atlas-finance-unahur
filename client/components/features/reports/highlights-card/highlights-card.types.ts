import type { DashboardData } from "@/lib/api/types";

export type HighlightTone = "positive" | "negative" | "neutral";

export interface Highlight {
  id: string;
  tone: HighlightTone;
  text: string;
}

export interface HighlightsCardProps {
  categoryChanges: DashboardData["categoryChanges"];
  expensesDeltaPct: number | null;
  savingsDeltaPct: number | null;
  currency: string;
}

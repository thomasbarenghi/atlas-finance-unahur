import { formatCurrency, formatPercent } from "@/lib/format";
import type { Highlight, HighlightsCardProps } from "./highlights-card.types";

const MAX_HIGHLIGHTS = 3;

export const buildHighlights = ({
  categoryChanges,
  expensesDeltaPct,
  savingsDeltaPct,
  currency,
}: HighlightsCardProps): Highlight[] => {
  const highlights: Highlight[] = [];

  if (expensesDeltaPct !== null && expensesDeltaPct !== 0) {
    const lower = expensesDeltaPct < 0;
    highlights.push({
      id: "expenses",
      tone: lower ? "positive" : "negative",
      text: `Gastaste ${formatPercent(Math.abs(expensesDeltaPct) / 100)} ${
        lower ? "menos" : "más"
      } que el período anterior.`,
    });
  }

  if (savingsDeltaPct !== null && savingsDeltaPct !== 0) {
    const up = savingsDeltaPct > 0;
    highlights.push({
      id: "savings",
      tone: up ? "positive" : "negative",
      text: `Tu ahorro ${up ? "subió" : "bajó"} ${formatPercent(
        Math.abs(savingsDeltaPct) / 100,
      )}.`,
    });
  }

  const categoryHighlight = categoryChanges.find(
    (change) => change.previous > 0 && change.current !== change.previous,
  );
  if (categoryHighlight) {
    const decrease = categoryHighlight.current < categoryHighlight.previous;
    const amount = Math.abs(
      categoryHighlight.current - categoryHighlight.previous,
    );
    highlights.push({
      id: `category-${categoryHighlight.categoryId}`,
      tone: decrease ? "positive" : "negative",
      text: decrease
        ? `Gastaste ${formatCurrency(amount, currency)} menos en ${categoryHighlight.name}.`
        : `${categoryHighlight.name} aumentó ${formatCurrency(amount, currency)}.`,
    });
  }

  return highlights.slice(0, MAX_HIGHLIGHTS);
};

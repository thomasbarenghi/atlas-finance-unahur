import { TrendingDown, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/common/section-card";
import { cn } from "@/lib/utils";
import { buildHighlights } from "./highlights-card.utils";
import type { HighlightsCardProps } from "./highlights-card.types";

export const HighlightsCard = (props: HighlightsCardProps) => {
  const highlights = buildHighlights(props);

  if (highlights.length === 0) return null;

  return (
    <SectionCard
      title="Cambios destacados"
      description="Respecto del período anterior."
    >
      <ul className="flex flex-col gap-2">
        {highlights.map((highlight) => {
          const Icon =
            highlight.tone === "negative" ? TrendingUp : TrendingDown;
          return (
            <li key={highlight.id} className="flex items-start gap-2 text-sm">
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  highlight.tone === "positive"
                    ? "text-success"
                    : highlight.tone === "negative"
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span>{highlight.text}</span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};

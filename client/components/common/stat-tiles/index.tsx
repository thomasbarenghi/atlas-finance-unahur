import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatTilesProps } from "./stat-tiles.types";
import { statDeltaTone } from "./stat-tiles.utils";

export type { StatTile } from "./stat-tiles.types";

export const StatTiles = ({ stats }: StatTilesProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:overflow-x-auto md:pb-0.5 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card flex min-w-0 flex-col gap-1 rounded-2xl border px-3 py-2.5 md:min-w-[8.5rem] md:flex-1"
        >
          <span className="text-muted-foreground text-xs">{stat.label}</span>
          <span className={cn("text-sm font-semibold tabular-nums", stat.tone)}>
            {stat.value}
          </span>
          {stat.deltaPct !== undefined &&
          stat.deltaPct !== null &&
          stat.favorable ? (
            <span
              className={cn(
                "text-[11px] tabular-nums",
                statDeltaTone(stat.deltaPct, stat.favorable),
              )}
            >
              {stat.deltaPct >= 0 ? "+" : ""}
              {formatPercent(stat.deltaPct / 100)} vs. ant.
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
};

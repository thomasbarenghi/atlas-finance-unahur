"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import { cn } from "@/lib/utils";
import type { PositionsListProps } from "./positions-list.types";

export const PositionsList = ({ positions, isLoading }: PositionsListProps) => {
  return (
    <DataList
      data={positions}
      isLoading={isLoading}
      skeletonCount={2}
      getRowKey={(position) => position.id}
      emptyState={
        <EmptyState
          icon={TrendingUp}
          title="Todavía no tenés inversiones"
          description="Cargá un instrumento y su costo promedio para valuarlo."
        />
      }
      renderItem={(position) => {
        const positive = (position.profitLoss ?? 0) >= 0;

        return (
          <DataListItem
            href={`/patrimony/investments/detail?id=${position.id}`}
            leading={
              <IconBadge
                icon={positive ? TrendingUp : TrendingDown}
                tone={positive ? "success" : "destructive"}
              />
            }
            title={position.instrument}
            subtitle={`${position.quantity} ${position.symbol}`}
            trailing={
              <span className="flex flex-col items-end gap-0.5">
                {position.currentValue === null ? (
                  <span className="text-muted-foreground text-sm">—</span>
                ) : (
                  <Amount
                    value={position.currentValue}
                    currency={position.currency}
                  />
                )}
                {position.profitLossPct !== null ? (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      positive ? "text-success" : "text-destructive",
                    )}
                  >
                    {positive ? "+" : ""}
                    {position.profitLossPct.toFixed(1)}%
                  </span>
                ) : null}
              </span>
            }
          />
        );
      }}
    />
  );
};

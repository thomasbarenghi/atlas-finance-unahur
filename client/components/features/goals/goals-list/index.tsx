"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { DataList } from "@/components/common/data-list";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatMonth, formatPercentPoints } from "@/lib/format";
import { goalProgress } from "@/lib/goal";
import type { GoalsListProps } from "./goals-list.types";

export const GoalsList = ({
  goals,
  sourceNameById,
  isLoading,
  emptyTitle = "Todavía no tenés metas",
  emptyDescription = "Creá un objetivo de ahorro y seguí su progreso.",
}: GoalsListProps) => {
  return (
    <DataList
      data={goals}
      isLoading={isLoading}
      getRowKey={(goal) => goal.id}
      emptyState={
        <EmptyState
          icon={Target}
          title={emptyTitle}
          description={emptyDescription}
        />
      }
      renderItem={(goal) => {
        const {
          saved,
          target,
          remaining,
          progressPct,
          status,
          targetDate,
          monthlySaving,
        } = goalProgress(goal);
        const source = goal.sourceAccountId
          ? sourceNameById?.get(goal.sourceAccountId)
          : undefined;

        return (
          <Link
            href={`/goals/detail?id=${goal.id}`}
            className="flex w-full flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
          >
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                <Target className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{goal.name}</div>
                <div className="text-muted-foreground mt-0.5 truncate text-xs">
                  {formatCurrency(saved, goal.currency)} de{" "}
                  {formatCurrency(target, goal.currency)}
                  {source ? ` · ${source}` : ""}
                </div>
              </div>
              <StatusBadge variant="goal" status={status} />
            </div>
            <Progress value={progressPct} className="h-2" />
            <div className="text-muted-foreground flex items-center justify-between text-xs tabular-nums">
              <span>{formatPercentPoints(progressPct)}</span>
              <span>
                {saved < target
                  ? `Faltan ${formatCurrency(remaining, goal.currency)}`
                  : "Meta cumplida"}
              </span>
            </div>
            {targetDate || monthlySaving !== null ? (
              <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 text-xs">
                {targetDate ? (
                  <span>Objetivo: {formatMonth(targetDate)}</span>
                ) : null}
                {monthlySaving !== null ? (
                  <span className="tabular-nums">
                    Necesitás ahorrar{" "}
                    {formatCurrency(monthlySaving, goal.currency)}/mes
                  </span>
                ) : null}
              </div>
            ) : null}
          </Link>
        );
      }}
    />
  );
};

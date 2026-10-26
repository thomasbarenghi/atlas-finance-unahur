"use client";

import { formatCurrency, formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
}

export interface IncomeExpenseTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  currency: string;
}

export const IncomeExpenseTooltip = ({
  active,
  payload,
  label,
  currency,
}: IncomeExpenseTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const income = Number(
    payload.find((entry) => entry.dataKey === "income")?.value ?? 0,
  );
  const expenses = Number(
    payload.find((entry) => entry.dataKey === "expenses")?.value ?? 0,
  );
  const balance = income - expenses;

  return (
    <div className="bg-background grid min-w-44 gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">
        {label !== undefined ? formatMonth(String(label)) : ""}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Ingresos</span>
        <span className="text-success font-medium tabular-nums">
          {formatCurrency(income, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Gastos</span>
        <span className="text-destructive font-medium tabular-nums">
          {formatCurrency(expenses, currency)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t pt-1">
        <span className="text-muted-foreground">Balance</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            balance >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {balance >= 0 ? "+" : "−"}
          {formatCurrency(Math.abs(balance), currency)}
        </span>
      </div>
    </div>
  );
};

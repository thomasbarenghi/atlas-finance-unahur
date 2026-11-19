"use client";

import { createElement } from "react";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Amount } from "@/components/common/amount";
import {
  RowActionsMenu,
  type RowAction,
} from "@/components/common/row-actions-menu";
import type { Transaction, TransactionType } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildTransactionSubtitle } from "../transaction-row.utils";
import type { TransferDetails } from "../transaction-list.utils";

const TYPE_PRESENTATION: Record<
  TransactionType,
  { icon: LucideIcon; badge: string }
> = {
  income: { icon: ArrowUpRight, badge: "bg-primary/10 text-primary" },
  expense: {
    icon: ArrowDownRight,
    badge: "bg-destructive/10 text-destructive",
  },
  transfer: { icon: ArrowLeftRight, badge: "bg-primary/10 text-primary" },
};

const ROW_PADDING = {
  compact: "px-3.5 py-[12.5px] md:py-[13px]",
  default: "px-3.5 py-[14.5px] md:py-[13.5px]",
};

const TEXT_SIZE = {
  compact: "md:text-[14px] md:leading-[19px]",
  default: "md:text-[14.5px] md:leading-[20px]",
};

export interface TransactionRowProps {
  transaction: Transaction;
  accountNameById: Map<string, string>;
  accountCurrencyById: Map<string, string>;
  categoryNameById: Map<string, string>;
  contextAccountId?: string;
  transferDetails?: TransferDetails;
  compact?: boolean;
  showCents: boolean;
  onSelect?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export const TransactionRow = ({
  transaction,
  accountNameById,
  accountCurrencyById,
  categoryNameById,
  contextAccountId,
  transferDetails,
  compact = false,
  showCents,
  onSelect,
  onDelete,
}: TransactionRowProps) => {
  const { icon, badge } = TYPE_PRESENTATION[transaction.type];
  const currency = accountCurrencyById.get(transaction.accountId) ?? "ARS";
  const subtitle = buildTransactionSubtitle({
    transaction,
    accountNameById,
    accountCurrencyById,
    categoryNameById,
    contextAccountId,
    transferDetails,
    showCents,
  });
  const variant = compact ? "compact" : "default";
  const isTransfer = transaction.type === "transfer";
  const actions: RowAction[] = [
    ...(onSelect
      ? [
          {
            label: "Editar",
            icon: Pencil,
            onSelect: () => onSelect(transaction),
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Eliminar",
            icon: Trash2,
            variant: "destructive" as const,
            onSelect: () => onDelete(transaction),
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "hover:bg-muted/30 flex w-full items-center gap-2.5 transition-colors md:gap-3 md:px-[18px]",
        ROW_PADDING[variant],
      )}
    >
      <span
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-full md:size-9",
          badge,
        )}
      >
        {createElement(icon, { className: "size-4", "aria-hidden": true })}
      </span>
      <button
        type="button"
        onClick={onSelect ? () => onSelect(transaction) : undefined}
        className="flex min-w-0 flex-1 flex-col gap-px text-left"
      >
        <span
          className={cn(
            "text-ink truncate text-[13px] leading-[18px] font-semibold",
            TEXT_SIZE[variant],
          )}
        >
          {transaction.description}
        </span>
        <span className="text-muted-foreground truncate text-[10px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
          <span className="md:hidden">{subtitle.mobile}</span>
          <span className="hidden md:inline">{subtitle.desktop}</span>
        </span>
      </button>
      <div className="shrink-0 text-right">
        {isTransfer ? (
          <span
            className={cn(
              "text-muted-foreground text-[12.5px] leading-[17px] font-semibold tabular-nums",
              TEXT_SIZE[variant],
            )}
          >
            {formatCurrency(Math.abs(transaction.amount), currency, undefined, {
              showCents,
            })}
          </span>
        ) : (
          <Amount
            value={transaction.amount}
            currency={currency}
            type={transaction.type}
            showCents={showCents}
            className={cn(
              "text-[12.5px] leading-[17px] font-semibold",
              TEXT_SIZE[variant],
            )}
          />
        )}
      </div>
      {onDelete ? (
        <RowActionsMenu label={transaction.description} actions={actions} />
      ) : null}
    </div>
  );
};

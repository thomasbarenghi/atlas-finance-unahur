"use client";

import { useMemo } from "react";
import {
  ArrowLeftRight,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge, type IconBadgeTone } from "@/components/common/icon-badge";
import { Money } from "@/components/common/money";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import type { TransactionType } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import type { TransactionListProps } from "./transaction-list.types";
import { collapseTransfers } from "./transaction-list.utils";

const TYPE_PRESENTATION: Record<
  TransactionType,
  { icon: LucideIcon; tone: IconBadgeTone }
> = {
  income: { icon: TrendingUp, tone: "success" },
  expense: { icon: TrendingDown, tone: "destructive" },
  transfer: { icon: ArrowLeftRight, tone: "primary" },
};

export const TransactionList = ({
  transactions,
  accountNameById,
  categoryById,
  isLoading,
  pagination,
  onSelect,
  onDelete,
}: TransactionListProps) => {
  const rows = useMemo(() => collapseTransfers(transactions), [transactions]);

  return (
    <DataList
      data={rows}
      isLoading={isLoading}
      pagination={pagination}
      getRowKey={(transaction) => transaction.id}
      emptyState={
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin movimientos"
          description="No hay ingresos, gastos ni transferencias en este período."
        />
      }
      renderItem={(transaction) => {
        const { icon, tone } = TYPE_PRESENTATION[transaction.type];
        const category = transaction.categoryId
          ? categoryById.get(transaction.categoryId)
          : undefined;
        const accountName =
          accountNameById.get(transaction.accountId) ?? "Cuenta";
        const target = transaction.transferAccountId
          ? accountNameById.get(transaction.transferAccountId)
          : undefined;
        const isTransfer = transaction.type === "transfer";
        const subtitle = isTransfer
          ? [
              formatDate(transaction.date),
              "Transferencia",
              target ? `${accountName} → ${target}` : accountName,
            ].join(" · ")
          : [
              formatDate(transaction.date),
              category?.name ?? "Sin categoría",
              accountName,
            ].join(" · ");

        return (
          <DataListItem
            leading={<IconBadge icon={icon} tone={tone} />}
            title={transaction.description}
            subtitle={subtitle}
            trailing={
              isTransfer ? (
                <Money
                  value={Math.abs(transaction.amount)}
                  currency={transaction.currency}
                  className="text-muted-foreground font-medium"
                />
              ) : (
                <Amount
                  value={transaction.amount}
                  currency={transaction.currency}
                  type={transaction.type}
                />
              )
            }
            onClick={onSelect ? () => onSelect(transaction) : undefined}
            showChevron={false}
            trailingAction={
              onDelete ? (
                <RowActionsMenu
                  label={transaction.description}
                  actions={[
                    {
                      label: "Editar",
                      icon: Pencil,
                      hidden: !onSelect,
                      onSelect: () => onSelect?.(transaction),
                    },
                    {
                      label: "Eliminar",
                      icon: Trash2,
                      variant: "destructive",
                      onSelect: () => onDelete(transaction),
                    },
                  ]}
                />
              ) : undefined
            }
          />
        );
      }}
    />
  );
};

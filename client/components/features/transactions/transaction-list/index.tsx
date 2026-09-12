"use client";

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
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import type { TransactionType } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import type { TransactionListProps } from "./transaction-list.types";

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
  return (
    <DataList
      data={transactions}
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
        const subtitle = [
          formatDate(transaction.date),
          category?.name ?? "Sin categoría",
          target ? `${accountName} → ${target}` : accountName,
        ].join(" · ");

        return (
          <DataListItem
            leading={<IconBadge icon={icon} tone={tone} />}
            title={transaction.description}
            subtitle={subtitle}
            trailing={
              <Amount
                value={transaction.amount}
                currency={transaction.currency}
                type={transaction.type}
              />
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

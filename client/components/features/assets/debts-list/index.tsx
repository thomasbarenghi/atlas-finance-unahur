"use client";

import { CreditCard } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { DEBT_TYPE_LABELS } from "@/lib/labels";
import type { DebtsListProps } from "./debts-list.types";

export const DebtsList = ({ debts, assets, isLoading }: DebtsListProps) => {
  const assetNameById = new Map(assets.map((asset) => [asset.id, asset.name]));

  return (
    <DataList
      data={debts}
      isLoading={isLoading}
      skeletonCount={2}
      getRowKey={(debt) => debt.id}
      emptyState={
        <EmptyState
          icon={CreditCard}
          title="Todavía no tenés deudas"
          description="Registrá préstamos, hipotecas o tarjetas para descontarlas del patrimonio."
        />
      }
      renderItem={(debt) => {
        const assetName = debt.assetId
          ? assetNameById.get(debt.assetId)
          : undefined;
        return (
          <DataListItem
            href={`/patrimony/debts/detail?id=${debt.id}`}
            leading={<IconBadge icon={CreditCard} tone="destructive" />}
            title={debt.name}
            subtitle={`${DEBT_TYPE_LABELS[debt.type]}${assetName ? ` · ${assetName}` : ""}`}
            trailing={
              <span className="flex flex-col items-end gap-1">
                <Amount value={debt.balance} currency={debt.currency} />
                {debt.archived ? (
                  <StatusBadge variant="account" archived />
                ) : null}
              </span>
            }
          />
        );
      }}
    />
  );
};

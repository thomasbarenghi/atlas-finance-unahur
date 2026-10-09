"use client";

import { CreditCard } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { ArchivedSheet } from "@/components/common/archived-sheet";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import type { Debt } from "@/lib/api/types";
import { DEBT_TYPE_LABELS } from "@/lib/labels";
import type { DebtsListProps } from "./debts-list.types";

export const DebtsList = ({
  debts,
  assets,
  isLoading,
  emptyAction,
}: DebtsListProps) => {
  const assetNameById = new Map(assets.map((asset) => [asset.id, asset.name]));
  const archived = debts.filter((debt) => debt.archived);

  const renderDebt = (debt: Debt) => {
    const assetName = debt.assetId
      ? assetNameById.get(debt.assetId)
      : undefined;
    return (
      <DataListItem
        href={`/patrimony/debts/detail?id=${debt.id}`}
        leading={<IconBadge icon={CreditCard} tone="destructive" />}
        title={debt.name}
        subtitle={`${DEBT_TYPE_LABELS[debt.type]}${assetName ? ` · ${assetName}` : ""}`}
        trailing={<Amount value={debt.balance} currency={debt.currency} />}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <DataList
        data={debts.filter((debt) => !debt.archived)}
        isLoading={isLoading}
        skeletonCount={2}
        getRowKey={(debt) => debt.id}
        emptyState={
          <EmptyState
            icon={CreditCard}
            title="Todavía no tenés deudas"
            description="Registrá préstamos, hipotecas o tarjetas para descontarlas del patrimonio."
            action={emptyAction}
          />
        }
        renderItem={renderDebt}
      />
      <ArchivedSheet
        label="deudas"
        items={archived}
        getKey={(debt) => debt.id}
        renderItem={renderDebt}
      />
    </div>
  );
};

"use client";

import { Package } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDate } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/labels";
import type { AssetsListProps } from "./assets-list.types";

export const AssetsList = ({ assets, isLoading }: AssetsListProps) => {
  return (
    <DataList
      data={assets}
      isLoading={isLoading}
      skeletonCount={2}
      getRowKey={(asset) => asset.id}
      emptyState={
        <EmptyState
          icon={Package}
          title="Todavía no tenés activos"
          description="Cargá tus bienes e inversiones para ver tu patrimonio."
        />
      }
      renderItem={(asset) => (
        <DataListItem
          href={`/patrimony/assets/detail?id=${asset.id}`}
          leading={<IconBadge icon={Package} />}
          title={asset.name}
          subtitle={`${ASSET_TYPE_LABELS[asset.type]} · ${formatDate(
            asset.valuationDate,
          )}`}
          trailing={
            <span className="flex flex-col items-end gap-1">
              <Amount value={asset.currentValue} currency={asset.currency} />
              {asset.archived ? (
                <StatusBadge variant="account" archived />
              ) : null}
            </span>
          }
        />
      )}
    />
  );
};

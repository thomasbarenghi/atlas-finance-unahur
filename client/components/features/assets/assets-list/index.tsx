"use client";

import { Package } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { ArchivedSheet } from "@/components/common/archived-sheet";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { IconBadge } from "@/components/common/icon-badge";
import type { Asset } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/labels";
import type { AssetsListProps } from "./assets-list.types";

const renderAsset = (asset: Asset) => (
  <DataListItem
    href={`/patrimony/assets/detail?id=${asset.id}`}
    leading={<IconBadge icon={Package} />}
    title={asset.name}
    subtitle={`${ASSET_TYPE_LABELS[asset.type]} · ${formatDate(
      asset.valuationDate,
    )}`}
    trailing={<Amount value={asset.currentValue} currency={asset.currency} />}
  />
);

export const AssetsList = ({
  assets,
  isLoading,
  emptyAction,
}: AssetsListProps) => {
  const archived = assets.filter((asset) => asset.archived);

  return (
    <div className="flex flex-col gap-2">
      <DataList
        data={assets.filter((asset) => !asset.archived)}
        isLoading={isLoading}
        skeletonCount={2}
        getRowKey={(asset) => asset.id}
        emptyState={
          <EmptyState
            icon={Package}
            title="Todavía no tenés activos"
            description="Cargá tus bienes e inversiones para ver tu patrimonio."
            action={emptyAction}
          />
        }
        renderItem={renderAsset}
      />
      <ArchivedSheet
        label="activos"
        items={archived}
        getKey={(asset) => asset.id}
        renderItem={renderAsset}
      />
    </div>
  );
};

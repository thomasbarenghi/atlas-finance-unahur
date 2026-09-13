"use client";

import { useState } from "react";
import { Archive, LineChart, Package, Pencil } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { DetailMetric } from "@/components/common/detail-metric";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SectionCard } from "@/components/common/section-card";
import { TrendBadge } from "@/components/common/trend-badge";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Asset } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/labels";
import { valuationChange } from "@/lib/patrimony";
import { useArchiveAsset } from "@/lib/query/assets";
import { ASSET_TYPE_ICONS } from "@/components/features/assets/asset-icon";
import { AssetFormDialog } from "@/components/features/assets/asset-form-dialog";
import { ValuationSheet } from "@/components/features/assets/valuation-sheet";
import { EquitySummary } from "@/components/features/patrimony/equity-summary";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { ValuationHistory } from "@/components/features/patrimony/valuation-history";
import { ValuationSummary } from "@/components/features/patrimony/valuation-summary";
import { useAssetDetail } from "./hooks/use-asset-detail";

export const AssetDetailView = () => {
  const { asset, valuations, linkedDebt, isLoading } = useAssetDetail();
  const archiveAsset = useArchiveAsset();

  const [editOpen, setEditOpen] = useState(false);
  const [valuationOpen, setValuationOpen] = useState(false);

  const archiveAction = useConfirmAction<Asset>({
    run: (target) => archiveAsset.mutateAsync(target.id),
    successMessage: "Activo archivado",
    errorMessage: "No se pudo archivar el activo",
  });

  if (isLoading) {
    return <DetailPageSkeleton metricCount={5} />;
  }

  if (!asset) {
    return (
      <DetailPageNotFound
        entityLabel="Activo"
        icon={Package}
        title="Activo no encontrado"
        description="El activo que buscás no existe o fue archivado."
      />
    );
  }

  const Icon = ASSET_TYPE_ICONS[asset.type];
  const change = valuationChange(valuations);
  const debtHref = linkedDebt
    ? `/patrimony/debts/detail?id=${linkedDebt.id}`
    : undefined;

  return (
    <DetailPage
      title={asset.name}
      description={`${ASSET_TYPE_LABELS[asset.type]} · ${asset.currency}${
        asset.archived ? " · Archivado" : ""
      }`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar activo"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
          <RowActionsMenu
            label={asset.name}
            triggerLabel="Más acciones"
            actions={[
              {
                label: "Valuaciones",
                icon: LineChart,
                onSelect: () => setValuationOpen(true),
              },
              {
                label: "Archivar",
                icon: Archive,
                variant: "destructive",
                hidden: asset.archived,
                onSelect: () => archiveAction.request(asset),
              },
            ]}
          />
        </>
      }
    >
      <PatrimonyHero
        icon={Icon}
        title={asset.name}
        subtitle={`${ASSET_TYPE_LABELS[asset.type]} · ${asset.currency}`}
        value={asset.currentValue}
        currency={asset.currency}
        supportingText={`Actualizado ${formatDate(asset.valuationDate)}`}
        badge={
          change?.deltaPct != null ? (
            <TrendBadge
              deltaPct={change.deltaPct}
              label="desde la valuación anterior"
            />
          ) : null
        }
      />

      <ValuationSummary valuations={valuations} currency={asset.currency} />

      {linkedDebt ? (
        <EquitySummary
          assetValue={asset.currentValue}
          debt={linkedDebt.balance}
          currency={asset.currency}
          debtHref={debtHref}
          debtLabel={linkedDebt.name}
        />
      ) : null}

      <ValuationHistory valuations={valuations} currency={asset.currency} />

      <SectionCard title="Información">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailMetric label="Tipo" value={ASSET_TYPE_LABELS[asset.type]} />
          <DetailMetric label="Moneda" value={asset.currency} />
          <DetailMetric
            label="Fecha de valuación"
            value={formatDate(asset.valuationDate)}
          />
        </div>
        {asset.notes ? (
          <div className="mt-3 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Notas</span>
            <p className="text-sm whitespace-pre-line">{asset.notes}</p>
          </div>
        ) : null}
      </SectionCard>

      <AssetFormDialog
        key={asset.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        asset={asset}
      />
      <ValuationSheet
        asset={asset}
        open={valuationOpen}
        onOpenChange={setValuationOpen}
      />
      <ConfirmActionDialog
        action={archiveAction}
        title="Archivar activo"
        description={(target) =>
          `El activo "${target.name}" dejará de contar en tu patrimonio.`
        }
        confirmLabel="Archivar"
      />
    </DetailPage>
  );
};

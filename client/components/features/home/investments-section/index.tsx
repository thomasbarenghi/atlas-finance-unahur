"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Asset, Debt, Position } from "@/lib/api/types";
import { useArchiveAsset, useAssets } from "@/lib/query/assets";
import { useArchiveDebt, useDebts } from "@/lib/query/debts";
import { useDeletePosition, usePositions } from "@/lib/query/positions";
import { AssetFormDialog } from "@/components/features/assets/asset-form-dialog";
import { AssetsList } from "@/components/features/assets/assets-list";
import { DebtFormDialog } from "@/components/features/assets/debt-form-dialog";
import { DebtsList } from "@/components/features/assets/debts-list";
import {
  InvestmentTypePicker,
  type InvestmentCreationType,
} from "@/components/features/assets/investment-type-picker";
import { PositionFormDialog } from "@/components/features/assets/position-form-dialog";
import { PositionsList } from "@/components/features/assets/positions-list";
import { ValuationSheet } from "@/components/features/assets/valuation-sheet";

export const InvestmentsSection = () => {
  const assetsQuery = useAssets();
  const positionsQuery = usePositions();
  const debtsQuery = useDebts();
  const archiveAsset = useArchiveAsset();
  const archiveDebt = useArchiveDebt();
  const deletePosition = useDeletePosition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [assetDialog, setAssetDialog] = useState<{ asset?: Asset } | null>(
    null,
  );
  const [valuationSheet, setValuationSheet] = useState<Asset | null>(null);
  const [positionDialog, setPositionDialog] = useState<{
    position?: Position;
  } | null>(null);
  const [debtDialog, setDebtDialog] = useState<{ debt?: Debt } | null>(null);

  const archiveAssetAction = useConfirmAction<Asset>({
    run: (asset) => archiveAsset.mutateAsync(asset.id),
    successMessage: "Activo archivado",
    errorMessage: "No se pudo archivar",
  });
  const deletePositionAction = useConfirmAction<Position>({
    run: (position) => deletePosition.mutateAsync(position.id),
    successMessage: "Posición eliminada",
    errorMessage: "No se pudo eliminar",
  });
  const archiveDebtAction = useConfirmAction<Debt>({
    run: (debt) => archiveDebt.mutateAsync(debt.id),
    successMessage: "Deuda archivada",
    errorMessage: "No se pudo archivar",
  });

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const positions = useMemo(
    () => positionsQuery.data ?? [],
    [positionsQuery.data],
  );
  const debts = useMemo(() => debtsQuery.data ?? [], [debtsQuery.data]);

  const handleSelect = (type: InvestmentCreationType) => {
    setPickerOpen(false);
    if (type === "asset") setAssetDialog({});
    else if (type === "position") setPositionDialog({});
    else setDebtDialog({});
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">Inversiones</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Nuevo activo, inversión o deuda"
          onClick={() => setPickerOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">Activos</h3>
        <AssetsList
          assets={assets}
          isLoading={assetsQuery.isLoading}
          onEdit={(asset) => setAssetDialog({ asset })}
          onValuations={setValuationSheet}
          onArchive={archiveAssetAction.request}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">Mercado</h3>
        <PositionsList
          positions={positions}
          isLoading={positionsQuery.isLoading}
          onEdit={(position) => setPositionDialog({ position })}
          onDelete={deletePositionAction.request}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">Deudas</h3>
        <DebtsList
          debts={debts}
          assets={assets}
          isLoading={debtsQuery.isLoading}
          onEdit={(debt) => setDebtDialog({ debt })}
          onArchive={archiveDebtAction.request}
        />
      </div>

      <InvestmentTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
      />

      <AssetFormDialog
        key={assetDialog?.asset?.id ?? "asset-new"}
        open={Boolean(assetDialog)}
        onOpenChange={(open) => {
          if (!open) setAssetDialog(null);
        }}
        asset={assetDialog?.asset}
      />
      <ValuationSheet
        asset={valuationSheet}
        open={Boolean(valuationSheet)}
        onOpenChange={(open) => {
          if (!open) setValuationSheet(null);
        }}
      />
      <PositionFormDialog
        key={positionDialog?.position?.id ?? "position-new"}
        open={Boolean(positionDialog)}
        onOpenChange={(open) => {
          if (!open) setPositionDialog(null);
        }}
        position={positionDialog?.position}
      />
      <DebtFormDialog
        key={debtDialog?.debt?.id ?? "debt-new"}
        open={Boolean(debtDialog)}
        onOpenChange={(open) => {
          if (!open) setDebtDialog(null);
        }}
        debt={debtDialog?.debt}
        assets={assets}
      />

      <ConfirmDialog
        open={archiveAssetAction.isOpen}
        onOpenChange={(open) => {
          if (!open) archiveAssetAction.clear();
        }}
        title="Archivar activo"
        description={`El activo "${archiveAssetAction.target?.name ?? ""}" se ocultará pero conservará su historial.`}
        confirmLabel="Archivar"
        variant="destructive"
        isPending={archiveAssetAction.isPending}
        onConfirm={archiveAssetAction.confirm}
      />
      <ConfirmDialog
        open={deletePositionAction.isOpen}
        onOpenChange={(open) => {
          if (!open) deletePositionAction.clear();
        }}
        title="Eliminar posición"
        description={`Se eliminará "${deletePositionAction.target?.instrument ?? ""}".`}
        confirmLabel="Eliminar"
        variant="destructive"
        isPending={deletePositionAction.isPending}
        onConfirm={deletePositionAction.confirm}
      />
      <ConfirmDialog
        open={archiveDebtAction.isOpen}
        onOpenChange={(open) => {
          if (!open) archiveDebtAction.clear();
        }}
        title="Archivar deuda"
        description={`La deuda "${archiveDebtAction.target?.name ?? ""}" se ocultará pero conservará su historial.`}
        confirmLabel="Archivar"
        variant="destructive"
        isPending={archiveDebtAction.isPending}
        onConfirm={archiveDebtAction.confirm}
      />
    </section>
  );
};

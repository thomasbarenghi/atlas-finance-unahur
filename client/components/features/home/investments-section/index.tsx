"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/lib/query/assets";
import { useDebts } from "@/lib/query/debts";
import { usePositions } from "@/lib/query/positions";
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

export const InvestmentsSection = () => {
  const assetsQuery = useAssets();
  const positionsQuery = usePositions();
  const debtsQuery = useDebts();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const positions = useMemo(
    () => positionsQuery.data ?? [],
    [positionsQuery.data],
  );
  const debts = useMemo(() => debtsQuery.data ?? [], [debtsQuery.data]);

  const handleSelect = (type: InvestmentCreationType) => {
    setPickerOpen(false);
    if (type === "asset") setAssetOpen(true);
    else if (type === "position") setPositionOpen(true);
    else setDebtOpen(true);
  };

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader
        title="Patrimonio"
        description="Activos, inversiones financieras y deudas."
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports/investments">
                <span className="hidden sm:inline">Ver reportes</span>
                <ArrowUpRight />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Nuevo activo, inversión o deuda"
              onClick={() => setPickerOpen(true)}
            >
              <Plus />
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">Activos</h3>
        <AssetsList assets={assets} isLoading={assetsQuery.isLoading} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">
          Inversiones financieras
        </h3>
        <PositionsList
          positions={positions}
          isLoading={positionsQuery.isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">Deudas</h3>
        <DebtsList
          debts={debts}
          assets={assets}
          isLoading={debtsQuery.isLoading}
        />
      </div>

      <InvestmentTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
      />

      <AssetFormDialog open={assetOpen} onOpenChange={setAssetOpen} />
      <PositionFormDialog open={positionOpen} onOpenChange={setPositionOpen} />
      <DebtFormDialog
        open={debtOpen}
        onOpenChange={setDebtOpen}
        assets={assets}
      />
    </section>
  );
};

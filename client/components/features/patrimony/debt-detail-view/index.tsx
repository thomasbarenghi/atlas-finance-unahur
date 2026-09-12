"use client";

import { useState } from "react";
import { Archive, CreditCard, Pencil } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { DetailMetric } from "@/components/common/detail-metric";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Debt } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { DEBT_TYPE_LABELS } from "@/lib/labels";
import { useArchiveDebt } from "@/lib/query/debts";
import { DebtFormDialog } from "@/components/features/assets/debt-form-dialog";
import { EquitySummary } from "@/components/features/patrimony/equity-summary";
import { LinkedEntityCard } from "@/components/features/patrimony/linked-entity-card";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { useDebtDetail } from "./hooks/use-debt-detail";

export const DebtDetailView = () => {
  const { debt, linkedAsset, assets, isLoading } = useDebtDetail();
  const archiveDebt = useArchiveDebt();

  const [editOpen, setEditOpen] = useState(false);

  const archiveAction = useConfirmAction<Debt>({
    run: (target) => archiveDebt.mutateAsync(target.id),
    successMessage: "Deuda archivada",
    errorMessage: "No se pudo archivar la deuda",
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!debt) {
    return (
      <DetailPageNotFound
        entityLabel="Deuda"
        icon={CreditCard}
        title="Deuda no encontrada"
        description="La deuda que buscás no existe o fue archivada."
      />
    );
  }

  const assetHref = linkedAsset
    ? `/patrimony/assets/detail?id=${linkedAsset.id}`
    : undefined;

  return (
    <DetailPage
      title={debt.name}
      description={`${DEBT_TYPE_LABELS[debt.type]} · ${debt.currency}${
        debt.archived ? " · Archivada" : ""
      }`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar deuda"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
          <RowActionsMenu
            label={debt.name}
            triggerLabel="Más acciones"
            actions={[
              {
                label: "Editar",
                icon: Pencil,
                onSelect: () => setEditOpen(true),
              },
              {
                label: "Archivar",
                icon: Archive,
                variant: "destructive",
                hidden: debt.archived,
                onSelect: () => archiveAction.request(debt),
              },
            ]}
          />
        </>
      }
    >
      <PatrimonyHero
        icon={CreditCard}
        title="Saldo pendiente"
        subtitle={`${DEBT_TYPE_LABELS[debt.type]} · ${debt.currency}`}
        value={debt.balance}
        currency={debt.currency}
        variant="negative"
        supportingText={`Actualizado ${formatDate(debt.date)}`}
      />

      {linkedAsset ? (
        <>
          <LinkedEntityCard
            label="Activo vinculado"
            title={linkedAsset.name}
            amount={linkedAsset.currentValue}
            currency={linkedAsset.currency}
            href={assetHref ?? "#"}
          />
          <EquitySummary
            assetValue={linkedAsset.currentValue}
            debt={debt.balance}
            currency={linkedAsset.currency}
            title="Equity del activo"
          />
        </>
      ) : null}

      <SectionCard title="Información">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailMetric label="Tipo" value={DEBT_TYPE_LABELS[debt.type]} />
          <DetailMetric label="Moneda" value={debt.currency} />
          <DetailMetric
            label="Fecha de actualización"
            value={formatDate(debt.date)}
          />
          <DetailMetric
            label="Activo vinculado"
            value={linkedAsset?.name ?? "Sin vincular"}
            className="col-span-2 sm:col-span-3"
          />
        </div>
      </SectionCard>

      <DebtFormDialog
        key={debt.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        debt={debt}
        assets={assets}
      />
      <ConfirmActionDialog
        action={archiveAction}
        title="Archivar deuda"
        description={(target) =>
          `La deuda "${target.name}" dejará de descontarse de tu patrimonio.`
        }
        confirmLabel="Archivar"
      />
    </DetailPage>
  );
};

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { EmptyState } from "@/components/common/empty-state";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SignedMoney } from "@/components/common/signed-money";
import { TrendBadge } from "@/components/common/trend-badge";
import { WarningBadge } from "@/components/common/warning-badge";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Position } from "@/lib/api/types";
import { formatCurrency, formatDateTime, formatTimeAgo } from "@/lib/format";
import { useDeletePosition } from "@/lib/query/positions";
import { cn } from "@/lib/utils";
import { PositionFormDialog } from "@/components/features/assets/position-form-dialog";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { PositionCalculationCard } from "./components/position-calculation-card";
import { PositionMetrics } from "./components/position-metrics";
import { usePositionDetail } from "./hooks/use-position-detail";

export const PositionDetailView = () => {
  const { position, convertedValue, displayCurrency, isLoading } =
    usePositionDetail();
  const deletePosition = useDeletePosition();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);

  const deleteAction = useConfirmAction<Position>({
    run: (target) => deletePosition.mutateAsync(target.id),
    successMessage: "Posición eliminada",
    errorMessage: "No se pudo eliminar la posición",
    onSuccess: () => router.push("/dashboard"),
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!position) {
    return (
      <DetailPageNotFound
        entityLabel="Inversión"
        icon={TrendingUp}
        title="Inversión no encontrada"
        description="La posición que buscás no existe o fue eliminada."
      />
    );
  }

  const hasQuote = position.currentValue !== null;
  const positive = (position.profitLoss ?? 0) >= 0;
  const ProfitIcon = positive ? TrendingUp : TrendingDown;
  const supportingParts = [
    `${position.quantity} ${position.symbol}`,
    hasQuote && convertedValue !== null && position.currency !== displayCurrency
      ? `≈ ${formatCurrency(convertedValue, displayCurrency)}`
      : null,
  ].filter(Boolean);

  return (
    <DetailPage
      title={position.instrument}
      description={`${position.symbol} · ${position.currency}`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar posición"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
          <RowActionsMenu
            label={position.instrument}
            triggerLabel="Más acciones"
            actions={[
              {
                label: "Editar",
                icon: Pencil,
                onSelect: () => setEditOpen(true),
              },
              {
                label: "Eliminar",
                icon: Trash2,
                variant: "destructive",
                onSelect: () => deleteAction.request(position),
              },
            ]}
          />
        </>
      }
    >
      <PatrimonyHero
        icon={TrendingUp}
        title={position.instrument}
        subtitle={`${position.symbol} · ${position.currency}`}
        value={position.currentValue ?? position.costBasis}
        currency={position.currency}
        supportingText={supportingParts.join(" · ")}
        badge={
          hasQuote && position.profitLoss !== null ? (
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  positive ? "text-success" : "text-destructive",
                )}
              >
                <ProfitIcon className="size-4" aria-hidden />
                <SignedMoney
                  value={position.profitLoss}
                  currency={position.currency}
                  className="text-sm font-semibold"
                />
              </span>
              <TrendBadge deltaPct={position.profitLossPct} />
            </span>
          ) : null
        }
      />

      {position.isStale ? (
        <WarningBadge
          label={
            position.quoteDate
              ? `Cotización desactualizada · ${formatTimeAgo(position.quoteDate)}`
              : "Cotización desactualizada"
          }
          detail={
            position.quoteDate
              ? `Última actualización: ${formatDateTime(position.quoteDate)}`
              : undefined
          }
        />
      ) : null}

      {!hasQuote ? (
        <EmptyState
          icon={TrendingDown}
          title="Sin cotización actual"
          description="No pudimos obtener un precio de mercado. Se muestra el capital invertido hasta que haya una cotización."
        />
      ) : null}

      <PositionMetrics position={position} positive={positive} />
      <PositionCalculationCard />

      <PositionFormDialog
        key={position.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        position={position}
      />
      <ConfirmActionDialog
        action={deleteAction}
        title="Eliminar posición"
        description={(target) =>
          `Se eliminará "${target.instrument}" de tus inversiones.`
        }
        confirmLabel="Eliminar"
      />
    </DetailPage>
  );
};

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DetailMetric } from "@/components/common/detail-metric";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { PageHeader } from "@/components/common/page-header";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SectionCard } from "@/components/common/section-card";
import { TrendBadge } from "@/components/common/trend-badge";
import { WarningBadge } from "@/components/common/warning-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Position } from "@/lib/api/types";
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatTimeAgo,
} from "@/lib/format";
import { useDeletePosition } from "@/lib/query/positions";
import { cn } from "@/lib/utils";
import { PositionFormDialog } from "@/components/features/assets/position-form-dialog";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
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
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Inversión" />
        <EmptyState
          icon={TrendingUp}
          title="Inversión no encontrada"
          description="La posición que buscás no existe o fue eliminada."
          action={
            <Button asChild>
              <Link href="/dashboard">Volver al inicio</Link>
            </Button>
          }
        />
      </div>
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
    <div className="flex flex-col gap-6">
      <PageHeader
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
      />

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
                {positive ? "+" : "−"}
                {formatCurrency(
                  Math.abs(position.profitLoss),
                  position.currency,
                )}
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

      <SectionCard title="Detalle de la posición">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailMetric
            label="Cantidad"
            value={`${position.quantity} ${position.symbol}`}
          />
          <DetailMetric
            label="Costo promedio"
            value={
              <Money value={position.avgCost} currency={position.currency} />
            }
          />
          <DetailMetric
            label="Capital invertido"
            value={
              <Money value={position.costBasis} currency={position.currency} />
            }
          />
          <DetailMetric
            label="Precio actual"
            value={
              position.currentPrice === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <Money
                  value={position.currentPrice}
                  currency={position.currency}
                />
              )
            }
          />
          <DetailMetric
            label="Valor actual"
            value={
              position.currentValue === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <Money
                  value={position.currentValue}
                  currency={position.currency}
                />
              )
            }
          />
          <DetailMetric
            label="Resultado"
            value={
              position.profitLoss === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span
                  className={positive ? "text-success" : "text-destructive"}
                >
                  {positive ? "+" : "−"}
                  {formatCurrency(
                    Math.abs(position.profitLoss),
                    position.currency,
                  )}
                </span>
              )
            }
          />
          <DetailMetric
            label="Rentabilidad"
            value={
              position.profitLossPct === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span
                  className={positive ? "text-success" : "text-destructive"}
                >
                  {positive ? "+" : ""}
                  {formatPercent(position.profitLossPct / 100)}
                </span>
              )
            }
          />
          <DetailMetric label="Moneda" value={position.currency} />
          <DetailMetric
            label="Última cotización"
            value={
              position.quoteDate ? (
                formatDateTime(position.quoteDate)
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Cómo se calcula"
        description="Qué datos ingresás y cuáles se derivan del mercado."
      >
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Cantidad</span>
            <span className="font-medium">Editable</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Costo promedio</span>
            <span className="font-medium">Editable</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Precio actual</span>
            <span className="font-medium">Automático (cotización)</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Valor actual</span>
            <span className="font-medium">Calculado</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Resultado</span>
            <span className="font-medium">Calculado</span>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Evolución"
        description="Precio de la posición a lo largo del tiempo."
      >
        <EmptyState
          icon={TrendingUp}
          title="Sin historial de mercado"
          description="Todavía no hay series históricas de este instrumento. Se van a mostrar cuando estén disponibles."
        />
      </SectionCard>

      <PositionFormDialog
        key={position.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        position={position}
      />
      <ConfirmDialog
        open={deleteAction.isOpen}
        onOpenChange={(open) => {
          if (!open) deleteAction.clear();
        }}
        title="Eliminar posición"
        description={`Se eliminará "${deleteAction.target?.instrument ?? ""}" de tus inversiones.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isPending={deleteAction.isPending}
        onConfirm={deleteAction.confirm}
      />
    </div>
  );
};

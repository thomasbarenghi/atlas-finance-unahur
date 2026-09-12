"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Target, Wallet } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DetailMetric } from "@/components/common/detail-metric";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Account } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { goalAccountProgress } from "@/lib/goal-account";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { useArchiveAccount, useRestoreAccount } from "@/lib/query/accounts";
import { AccountFormDialog } from "@/components/features/accounts/account-form-dialog";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { useGoalDetail } from "./hooks/use-goal-detail";

export const GoalDetailView = () => {
  const { goal, sourceAccount, isLoading } = useGoalDetail();
  const archiveAccount = useArchiveAccount();
  const restoreAccount = useRestoreAccount();

  const [editOpen, setEditOpen] = useState(false);

  const archiveAction = useConfirmAction<Account>({
    run: (target) =>
      target.archived
        ? restoreAccount.mutateAsync(target.id)
        : archiveAccount.mutateAsync(target.id),
    successMessage: (target) =>
      target.archived ? "Meta restaurada" : "Meta archivada",
    errorMessage: "No se pudo actualizar la meta",
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Meta" />
        <EmptyState
          icon={Target}
          title="Meta no encontrada"
          description="La meta que buscás no existe o fue eliminada."
          action={
            <Button asChild>
              <Link href="/dashboard">Volver al inicio</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const progress = goalAccountProgress(goal);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={goal.name}
        description={`${ACCOUNT_TYPE_LABELS[goal.type]} · ${goal.currency}`}
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Editar meta"
              onClick={() => setEditOpen(true)}
            >
              <Pencil />
            </Button>
            <RowActionsMenu
              label={goal.name}
              triggerLabel="Más acciones"
              actions={[
                goal.archived
                  ? {
                      label: "Restaurar",
                      icon: ArchiveRestore,
                      onSelect: () => archiveAction.request(goal),
                    }
                  : {
                      label: "Archivar",
                      icon: Archive,
                      variant: "destructive",
                      onSelect: () => archiveAction.request(goal),
                    },
              ]}
            />
          </>
        }
      />

      <PatrimonyHero
        icon={Target}
        title={goal.name}
        subtitle={`Meta ${formatCurrency(progress.target, goal.currency)}`}
        value={progress.saved}
        currency={goal.currency}
        badge={<StatusBadge variant="goal" status={progress.status} />}
      />

      <div className="grid grid-cols-3 gap-3">
        <DetailMetric
          label="Acumulado"
          value={formatCurrency(progress.saved, goal.currency)}
        />
        <DetailMetric
          label="Objetivo"
          value={formatCurrency(progress.target, goal.currency)}
        />
        <DetailMetric
          label="Falta"
          value={formatCurrency(
            Math.max(0, progress.target - progress.saved),
            goal.currency,
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Progress value={progress.progressPct} className="h-2" />
        <span className="text-muted-foreground text-xs">
          {progress.progressPct.toFixed(0)}% de la meta
        </span>
      </div>

      {progress.targetDate || progress.monthlySaving !== null ? (
        <SectionCard
          title="Plan de ahorro"
          description="Para llegar a tiempo con tu objetivo."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {progress.targetDate ? (
              <DetailMetric
                label="Fecha objetivo"
                value={formatDate(progress.targetDate)}
              />
            ) : null}
            {progress.monthlySaving !== null ? (
              <DetailMetric
                label="Ahorro mensual necesario"
                value={`${formatCurrency(
                  progress.monthlySaving,
                  goal.currency,
                )}/mes`}
              />
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Origen del ahorro">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-muted-foreground text-xs">Vive en</span>
            <span className="truncate text-sm font-medium">
              {sourceAccount?.name ?? "Sin asignar"}
            </span>
          </div>
          {sourceAccount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/accounts/detail?id=${sourceAccount.id}`}>
                <Wallet /> Ver cuenta
              </Link>
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <AccountFormDialog
        key={goal.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        account={goal}
      />
      <ConfirmDialog
        open={archiveAction.isOpen}
        onOpenChange={(open) => {
          if (!open) archiveAction.clear();
        }}
        title={
          archiveAction.target?.archived ? "Restaurar meta" : "Archivar meta"
        }
        description={
          archiveAction.target?.archived
            ? `La meta "${archiveAction.target?.name ?? ""}" volverá a estar disponible.`
            : `La meta "${archiveAction.target?.name ?? ""}" conservará su historial.`
        }
        confirmLabel={archiveAction.target?.archived ? "Restaurar" : "Archivar"}
        variant={archiveAction.target?.archived ? "default" : "destructive"}
        isPending={archiveAction.isPending}
        onConfirm={archiveAction.confirm}
      />
    </div>
  );
};

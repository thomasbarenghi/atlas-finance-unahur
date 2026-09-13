"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Target, Wallet } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { DetailMetric } from "@/components/common/detail-metric";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Goal } from "@/lib/api/types";
import { formatCurrency, formatDate, formatPercentPoints } from "@/lib/format";
import { goalProgress } from "@/lib/goal";
import { useArchiveGoal, useRestoreGoal } from "@/lib/query/goals";
import { GoalFormDialog } from "@/components/features/goals/goal-form-dialog";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { useGoalDetail } from "./hooks/use-goal-detail";

export const GoalDetailView = () => {
  const { goal, sourceAccount, isLoading } = useGoalDetail();
  const archiveGoal = useArchiveGoal();
  const restoreGoal = useRestoreGoal();

  const [editOpen, setEditOpen] = useState(false);

  const archiveAction = useConfirmAction<Goal>({
    run: (target) =>
      target.archived
        ? restoreGoal.mutateAsync(target.id)
        : archiveGoal.mutateAsync(target.id),
    successMessage: (target) =>
      target.archived ? "Meta restaurada" : "Meta archivada",
    errorMessage: "No se pudo actualizar la meta",
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!goal) {
    return (
      <DetailPageNotFound
        entityLabel="Meta"
        icon={Target}
        title="Meta no encontrada"
        description="La meta que buscás no existe o fue eliminada."
      />
    );
  }

  const progress = goalProgress(goal);

  return (
    <DetailPage
      title={goal.name}
      description={`Meta de ahorro · ${goal.currency}`}
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
    >
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
          value={formatCurrency(progress.remaining, goal.currency)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Progress value={progress.progressPct} className="h-2" />
        <span className="text-muted-foreground text-xs">
          {formatPercentPoints(progress.progressPct)} de la meta
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

      <GoalFormDialog
        key={goal.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        goal={goal}
      />
      <ConfirmActionDialog
        action={archiveAction}
        title={(target) =>
          target.archived ? "Restaurar meta" : "Archivar meta"
        }
        description={(target) =>
          target.archived
            ? `La meta "${target.name}" volverá a estar disponible.`
            : `La meta "${target.name}" conservará su historial.`
        }
        confirmLabel={(target) => (target.archived ? "Restaurar" : "Archivar")}
        variant={(target) => (target.archived ? "default" : "destructive")}
      />
    </DetailPage>
  );
};

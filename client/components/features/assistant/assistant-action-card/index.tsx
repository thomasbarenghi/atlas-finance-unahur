"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantActionItem } from "@/hooks/use-assistant-chat";
import { cn } from "@/lib/utils";

const statusLabel = (action: AssistantActionItem): string => {
  if (action.status === "proposed" && action.pending) {
    return "Depende de otra acción";
  }
  switch (action.status) {
    case "proposed":
      return "Requiere tu confirmación";
    case "executing":
      return "Ejecutando…";
    case "executed":
      return "Listo";
    case "failed":
      return "No se pudo completar";
    case "cancelled":
      return "Cancelada";
  }
};

export interface AssistantActionCardProps {
  action: AssistantActionItem;
  locked?: boolean;
  onConfirm: (actionId: string) => void;
  onCancel: (actionId: string) => void;
}

export const AssistantActionCard = ({
  action,
  locked = false,
  onConfirm,
  onCancel,
}: AssistantActionCardProps) => {
  const isError = action.status === "failed";
  const isSuccess = action.status === "executed";
  const isPending = action.status === "proposed";
  const showStep = action.planId !== null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2",
        isError
          ? "border-destructive/40 bg-destructive/5"
          : isSuccess
            ? "border-primary/30 bg-primary/5"
            : action.status === "cancelled"
              ? "bg-muted/40"
              : "border-amber-500/40 bg-amber-500/5",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0" aria-hidden>
          {isError ? (
            <AlertCircle className="text-destructive size-4" />
          ) : isSuccess ? (
            <CheckCircle2 className="text-primary size-4" />
          ) : action.status === "cancelled" ? (
            <XCircle className="text-muted-foreground size-4" />
          ) : action.destructive ? (
            <ShieldAlert className="size-4 text-amber-600" />
          ) : (
            <Loader2
              className={cn(
                "size-4 text-amber-600",
                action.status === "executing" && "animate-spin",
              )}
            />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{action.title}</span>
            {showStep ? (
              <span className="bg-background/70 text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                Paso {action.step + 1}
              </span>
            ) : null}
          </div>
          <span className="text-muted-foreground text-xs">
            {statusLabel(action)}
          </span>
        </div>
      </div>

      {isPending && action.preview.fields.length > 0 ? (
        <dl className="flex flex-col gap-0.5">
          {action.preview.fields.map((field) => (
            <div
              key={field.label}
              className="flex justify-between gap-3 text-xs"
            >
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="text-right font-medium break-words">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {action.resultSummary && !isPending ? (
        <p className="text-muted-foreground text-xs">{action.resultSummary}</p>
      ) : null}

      {isPending && action.preview.impact ? (
        <p className="text-muted-foreground text-xs">{action.preview.impact}</p>
      ) : null}

      {isPending ? (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button
            size="sm"
            variant={action.destructive ? "destructive" : "default"}
            className="h-7 px-3 text-xs"
            disabled={locked || action.status === "executing"}
            onClick={() => onConfirm(action.actionId)}
          >
            {action.destructive ? "Eliminar" : "Confirmar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs"
            disabled={locked}
            onClick={() => onCancel(action.actionId)}
          >
            Cancelar
          </Button>
          {locked ? (
            <span className="text-muted-foreground text-[11px]">
              Confirmá primero el paso anterior.
            </span>
          ) : null}
        </div>
      ) : null}

      {isError && action.token ? (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            disabled={locked || action.status === "executing"}
            onClick={() => onConfirm(action.actionId)}
          >
            <RotateCcw className="mr-1 size-3" />
            Reintentar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs"
            onClick={() => onCancel(action.actionId)}
          >
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  );
};

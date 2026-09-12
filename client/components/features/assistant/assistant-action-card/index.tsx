"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AssistantAction } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  createAccount: "Cuenta creada",
  updateAccount: "Cuenta actualizada",
};

export const AssistantActionCard = ({
  action,
}: {
  action: AssistantAction;
}) => {
  const isError = action.status === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2",
        isError
          ? "border-destructive/40 bg-destructive/5"
          : "border-primary/30 bg-primary/5",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-3.5 shrink-0",
          isError ? "text-destructive" : "text-primary",
        )}
        aria-hidden
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium">
          {ACTION_LABELS[action.name] ?? "Acción del asistente"}
        </span>
        <span className="text-muted-foreground text-xs">{action.message}</span>
      </div>
    </div>
  );
};

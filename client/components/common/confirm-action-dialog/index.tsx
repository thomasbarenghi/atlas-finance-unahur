"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type {
  ConfirmActionDialogProps,
  ConfirmActionValue,
} from "./confirm-action-dialog.types";

export const ConfirmActionDialog = <T,>({
  action,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "destructive",
}: ConfirmActionDialogProps<T>) => {
  const target = action.target;

  const resolve = <R,>(value: ConfirmActionValue<T, R>, fallback: R): R => {
    if (typeof value !== "function") return value;
    return target !== null ? (value as (target: T) => R)(target) : fallback;
  };

  return (
    <ConfirmDialog
      open={action.isOpen}
      onOpenChange={(open) => {
        if (!open) action.clear();
      }}
      title={resolve(title, "")}
      description={resolve(description, "")}
      confirmLabel={resolve(confirmLabel, "Confirmar")}
      variant={resolve(variant, "destructive")}
      isPending={action.isPending}
      onConfirm={action.confirm}
    />
  );
};

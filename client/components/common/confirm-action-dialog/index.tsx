"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ConfirmAction } from "@/hooks/use-confirm-action";

export type ConfirmActionValue<T, R> = R | ((target: T) => R);

export interface ConfirmActionDialogProps<T> {
  action: ConfirmAction<T>;
  title: ConfirmActionValue<T, string>;
  description: ConfirmActionValue<T, string>;
  confirmLabel?: ConfirmActionValue<T, string>;
  variant?: ConfirmActionValue<T, "default" | "destructive">;
}

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
    <AlertDialog
      open={action.isOpen}
      onOpenChange={(open) => {
        if (!open) action.clear();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolve(title, "")}</AlertDialogTitle>
          <AlertDialogDescription>
            {resolve(description, "")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={action.clear}
            disabled={action.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant={
              resolve(variant, "destructive") === "destructive"
                ? "destructive"
                : "default"
            }
            disabled={action.isPending}
            onClick={action.confirm}
          >
            {resolve(confirmLabel, "Confirmar")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

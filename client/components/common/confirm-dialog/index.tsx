"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ConfirmDialogProps } from "./confirm-dialog.types";

export const ConfirmDialog = ({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isPending,
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

  return (
    <AlertDialog open={actualOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange?.(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => {
              onConfirm();
              handleOpenChange?.(false);
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

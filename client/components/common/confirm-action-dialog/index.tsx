"use client";

import { Trash2 } from "lucide-react";
import { BottomSheetHandle } from "@/components/common/bottom-sheet-handle";
import { DIALOG_BUTTON, SHEET_POSITION } from "@/components/common/ui-classes";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ConfirmAction } from "@/hooks/use-confirm-action";
import { cn } from "@/lib/utils";

export interface ConfirmActionDialogProps<T> {
  action: ConfirmAction<T>;
  title: string;
  description: (target: T) => string;
  confirmLabel?: string;
}

const CONTENT_CLASSES = cn(
  "gap-3 max-lg:!p-0 max-lg:!rounded-t-[20px] max-lg:!pb-[calc(18px+env(safe-area-inset-bottom))] sm:max-w-[430px] sm:gap-0 sm:rounded-[20px] sm:p-0",
  SHEET_POSITION,
);

export const ConfirmActionDialog = <T,>({
  action,
  title,
  description,
  confirmLabel = "Confirmar",
}: ConfirmActionDialogProps<T>) => {
  const target = action.target;

  return (
    <AlertDialog
      open={action.isOpen}
      onOpenChange={(open) => {
        if (!open) action.clear();
      }}
    >
      <AlertDialogContent className={CONTENT_CLASSES}>
        <BottomSheetHandle />

        <div className="flex flex-col items-center gap-3 px-[18px] pt-0.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:px-[22px] sm:pt-[22px] sm:text-left">
          <span className="bg-[#FBEAE8] dark:bg-destructive/15 flex size-11 shrink-0 items-center justify-center rounded-full sm:size-[38px]">
            <Trash2
              className="text-expense size-5 sm:size-[18px]"
              aria-hidden
            />
          </span>
          <div className="flex flex-col gap-3 sm:gap-1">
            <AlertDialogTitle className="text-ink font-heading text-[17px] leading-[21px] font-semibold sm:text-base sm:leading-5">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-[11px] leading-[17px] sm:text-[11.5px] sm:leading-[17px]">
              {target ? description(target) : ""}
            </AlertDialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-[18px] pt-1 pb-0 sm:flex-row sm:justify-end sm:px-[22px] sm:pt-[18px] sm:pb-[22px]">
          <Button
            variant="destructive"
            disabled={action.isPending}
            onClick={action.confirm}
            className={cn(
              DIALOG_BUTTON,
              "bg-expense hover:bg-expense/90 order-1 rounded-full text-white sm:order-2",
            )}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            onClick={action.clear}
            disabled={action.isPending}
            className={cn(
              DIALOG_BUTTON,
              "text-ink2 border-line order-2 rounded-full bg-[#F5F6F8] hover:bg-[#F5F6F8]/80 sm:order-1 sm:bg-card",
            )}
          >
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

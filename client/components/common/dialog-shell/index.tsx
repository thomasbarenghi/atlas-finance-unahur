"use client";

import type { ReactNode } from "react";
import { BottomSheetHandle } from "@/components/common/bottom-sheet-handle";
import {
  DIALOG_DESCRIPTION,
  DIALOG_HEADER,
  DIALOG_TITLE,
  SHEET_POSITION,
} from "@/components/common/ui-classes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SHEET_CLASSES =
  "sm:rounded-3xl max-lg:!rounded-t-3xl max-lg:max-h-[90dvh] max-lg:overflow-y-auto max-lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-lg:data-open:slide-in-from-bottom max-lg:data-closed:slide-out-to-bottom max-lg:[&_[data-slot=dialog-title]]:text-lg";

const CONTENT_CLASSES =
  "gap-3 p-0 max-lg:!pb-0 sm:max-w-[560px] max-sm:[&_[data-slot=dialog-close]]:top-[34px] max-sm:[&_[data-slot=dialog-close]]:right-[18px] sm:[&_[data-slot=dialog-close]]:top-5 sm:[&_[data-slot=dialog-close]]:right-[22px] [&_[data-slot=dialog-close]]:size-7 [&_[data-slot=dialog-close]]:bg-[#F5F6F8]";

export interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  contentClassName?: string;
  children: ReactNode;
}

export const DialogShell = ({
  open,
  onOpenChange,
  title,
  description,
  contentClassName,
  children,
}: DialogShellProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SHEET_CLASSES,
          SHEET_POSITION,
          CONTENT_CLASSES,
          contentClassName,
        )}
      >
        <BottomSheetHandle />
        <DialogHeader className={DIALOG_HEADER}>
          <DialogTitle className={DIALOG_TITLE}>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={DIALOG_DESCRIPTION}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

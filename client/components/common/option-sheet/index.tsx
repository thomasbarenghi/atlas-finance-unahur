"use client";

import { ResponsiveDialogContent } from "@/components/common/responsive-dialog";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { OptionSheetProps } from "./option-sheet.types";

export const OptionSheet = ({
  open,
  onOpenChange,
  title,
  description = "Elegí una opción.",
  options,
  value,
  onSelect,
}: OptionSheetProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option.value);
                onOpenChange(false);
              }}
              className={cn(
                "hover:bg-muted/50 flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm",
                option.value === value && "text-primary font-medium",
              )}
            >
              {option.label}
              {option.value === value ? (
                <span className="bg-primary size-2 rounded-full" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      </ResponsiveDialogContent>
    </Dialog>
  );
};

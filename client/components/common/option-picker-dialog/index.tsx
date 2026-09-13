"use client";

import { IconBadge } from "@/components/common/icon-badge";
import { ResponsiveDialogContent } from "@/components/common/responsive-dialog";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { OptionPickerDialogProps } from "./option-picker-dialog.types";

export type {
  OptionPickerDialogProps,
  OptionPickerOption,
} from "./option-picker-dialog.types";

export const OptionPickerDialog = <T extends string>({
  open,
  onOpenChange,
  title,
  description,
  options,
  layout = "rows",
  onSelect,
}: OptionPickerDialogProps<T>) => {
  const areCards = layout === "cards";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          className={cn("grid gap-3", areCards ? "grid-cols-2" : "grid-cols-1")}
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  "bg-card hover:bg-muted/40 active:bg-muted/60 flex rounded-2xl border p-4 text-left transition-colors",
                  areCards
                    ? "flex-col items-start gap-3"
                    : "items-center gap-3",
                )}
              >
                <IconBadge icon={Icon} shape="xl" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </ResponsiveDialogContent>
    </Dialog>
  );
};

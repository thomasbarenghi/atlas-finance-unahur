"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { DialogShell } from "@/components/common/dialog-shell";
import { FormShell } from "@/components/common/form-shell";
import { DIALOG_BUTTON, DIALOG_FOOTER } from "@/components/common/ui-classes";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface FormDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  submitLabel: string;
  isPending?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

export const FormDialog = <T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  submitLabel,
  isPending,
  contentClassName,
  children,
}: FormDialogProps<T>) => {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName={contentClassName}
    >
      <FormShell form={form} onSubmit={onSubmit} className="gap-0">
        <div className="dialog-body">{children}</div>
        <DialogFooter className={DIALOG_FOOTER}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={cn(
              DIALOG_BUTTON,
              "bg-[#F5F6F8] hover:bg-[#F5F6F8] sm:bg-card",
            )}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className={DIALOG_BUTTON}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </FormShell>
    </DialogShell>
  );
};

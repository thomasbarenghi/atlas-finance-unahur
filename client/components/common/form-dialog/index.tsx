"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { FormShell } from "@/components/common/form-shell";
import { ResponsiveDialogContent } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

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
  footerStart?: ReactNode;
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
  footerStart,
  children,
}: FormDialogProps<T>) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <FormShell form={form} onSubmit={onSubmit}>
          {children}
          <DialogFooter>
            {footerStart}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </FormShell>
      </ResponsiveDialogContent>
    </Dialog>
  );
};

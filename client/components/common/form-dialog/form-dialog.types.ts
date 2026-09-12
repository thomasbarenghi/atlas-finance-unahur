import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

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

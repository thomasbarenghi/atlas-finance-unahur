import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export interface FormShellProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
  children: ReactNode;
}

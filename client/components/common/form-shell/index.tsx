"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ReactNode } from "react";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface FormShellProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
  id?: string;
  children: ReactNode;
}

export const FormShell = <T extends FieldValues>({
  form,
  onSubmit,
  className,
  id,
  children,
}: FormShellProps<T>) => {
  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex min-w-0 flex-col gap-4", className)}
        noValidate
      >
        {children}
      </form>
    </Form>
  );
};

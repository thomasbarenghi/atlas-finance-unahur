"use client";

import type { FieldValues } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { FormShellProps } from "./form-shell.types";

export type { FormShellProps } from "./form-shell.types";

export const FormShell = <T extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormShellProps<T>) => {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex min-w-0 flex-col gap-4", className)}
        noValidate
      >
        {children}
      </form>
    </Form>
  );
};

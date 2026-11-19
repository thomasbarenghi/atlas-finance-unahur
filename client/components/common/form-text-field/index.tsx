"use client";

import type { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/common/ui-classes";
import { cn } from "@/lib/utils";

export interface FormTextFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: ComponentProps<"input">["type"];
  autoComplete?: string;
  multiline?: boolean;
  className?: string;
}

export const FormTextField = ({
  name,
  label,
  description,
  placeholder,
  type,
  autoComplete,
  multiline,
  className,
}: FormTextFieldProps) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          {label ? (
            <FormLabel className={FIELD_LABEL}>{label}</FormLabel>
          ) : null}
          <FormControl>
            {multiline ? (
              <Textarea
                rows={2}
                placeholder={placeholder}
                autoComplete={autoComplete}
                {...field}
                value={field.value ?? ""}
                className={cn(
                  "border-border bg-card min-h-[72px] rounded-[10px] shadow-none",
                  className,
                )}
              />
            ) : (
              <Input
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                {...field}
                value={field.value ?? ""}
                className={cn(FIELD_INPUT, "h-[42px]", className)}
              />
            )}
          </FormControl>
          {description ? (
            <FormDescription className="text-[10.5px]">
              {description}
            </FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

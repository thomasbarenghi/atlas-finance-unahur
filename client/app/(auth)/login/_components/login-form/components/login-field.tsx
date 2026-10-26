"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/common/ui-classes";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LoginFormValues } from "@/lib/validation/auth";

const LABEL_CLASS = cn(FIELD_LABEL, "text-[11px] leading-[15px]");

export interface LoginFieldProps {
  name: "email" | "password";
  label: string;
  icon: LucideIcon;
  autoComplete: string;
  type?: "email" | "password" | "text";
  placeholder?: string;
  inputClassName?: string;
  trailing?: ReactNode;
}

export const LoginField = ({
  name,
  label,
  icon: Icon,
  autoComplete,
  type,
  placeholder,
  inputClassName,
  trailing,
}: LoginFieldProps) => {
  const { control } = useFormContext<LoginFormValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          <FormLabel className={LABEL_CLASS}>{label}</FormLabel>
          <div className="relative">
            <Icon className="field-icon left-[13px] size-4" aria-hidden />
            <FormControl>
              <Input
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={cn(FIELD_INPUT, "h-11 pl-[37px]", inputClassName)}
                {...field}
              />
            </FormControl>
            {trailing}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

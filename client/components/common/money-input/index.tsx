"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMoneyInput } from "./hooks/use-money-input";
import type { MoneyInputProps } from "./money-input.types";

export type { MoneyInputProps } from "./money-input.types";

export const MoneyInput = ({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  disabled,
  prefix = "$",
  className,
  inputClassName,
}: MoneyInputProps) => {
  const { text, handleChange, handleBlur } = useMoneyInput({
    value,
    onChange,
    onBlur,
  });

  return (
    <div className={cn("relative", className)}>
      {prefix ? (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          {prefix}
        </span>
      ) : null}
      <Input
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(prefix ? "pl-7" : undefined, inputClassName)}
      />
    </div>
  );
};

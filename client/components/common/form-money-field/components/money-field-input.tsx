"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMoneyInput } from "../hooks/use-money-input";

export interface MoneyFieldInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const MoneyFieldInput = ({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  disabled,
  inputClassName,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: MoneyFieldInputProps) => {
  const { text, handleChange, handleBlur } = useMoneyInput({
    value,
    onChange,
    onBlur,
  });

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        $
      </span>
      <Input
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-7", inputClassName)}
      />
    </div>
  );
};

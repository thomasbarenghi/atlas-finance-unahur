"use client";

import { Input } from "@/components/ui/input";
import { FIELD_INPUT } from "@/components/common/ui-classes";
import { cn } from "@/lib/utils";
import { useMoneyInput } from "../hooks/use-money-input";

export interface MoneyFieldInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const MoneyFieldInput = ({
  value,
  onChange,
  onBlur,
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
      <span className="field-icon left-3 text-sm">$</span>
      <Input
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className={cn(FIELD_INPUT, "h-[42px] pl-7")}
      />
    </div>
  );
};

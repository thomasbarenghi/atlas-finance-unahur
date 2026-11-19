"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled,
  fullWidth,
}: SegmentedControlProps<T>) => {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "segmented h-10",
        fullWidth ? "w-full auto-cols-fr" : "w-fit",
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "segmented-item h-[34px] px-[13px] text-[12px] leading-[16px]",
              active
                ? "segmented-item-active"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

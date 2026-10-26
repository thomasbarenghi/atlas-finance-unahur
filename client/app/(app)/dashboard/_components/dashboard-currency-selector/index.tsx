"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DashboardCurrencySelectorProps {
  value: string;
  options: string[];
  onChange: (currency: string) => void;
  onOther?: () => void;
}

export const DashboardCurrencySelector = ({
  value,
  options,
  onChange,
  onOther,
}: DashboardCurrencySelectorProps) => {
  const [open, setOpen] = useState(false);
  if (options.length <= 1) return null;

  const choose = (currency: string) => {
    onChange(currency);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Moneda de lectura"
          className="bg-card border-border text-ink2 flex h-[30px] w-fit items-center gap-1 rounded-full border px-3 text-[11.5px] leading-[16px] font-semibold shadow-none md:h-[38px] md:px-4 md:text-[13px] md:leading-[18px]"
        >
          {value}
          <ChevronDown
            className="text-muted-foreground size-3 md:size-3.5"
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[190px] gap-0 p-1.5"
      >
        <div className="flex flex-col">
          {options.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => choose(currency)}
              className={cn(
                "hover:bg-muted/60 flex h-8 items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[12px] font-medium transition-colors",
                currency === value && "bg-accent/60 text-primary",
              )}
            >
              {currency}
              {currency === value ? (
                <Check className="size-3.5" aria-hidden />
              ) : null}
            </button>
          ))}
          {onOther ? (
            <>
              <div className="bg-line2 my-1 h-px" />
              <button
                type="button"
                onClick={() => {
                  onOther();
                  setOpen(false);
                }}
                className="hover:bg-muted/60 text-ink2 flex h-8 items-center gap-2 rounded-lg px-2.5 text-left text-[12px] font-medium transition-colors"
              >
                <Plus className="text-muted-foreground size-3.5" aria-hidden />
                Otra moneda
              </button>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  CurrencyPickerPanel,
  CurrencyPickerSheet,
} from "@/components/common/currency-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FIELD_LABEL } from "@/components/common/ui-classes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { currencyName } from "@/lib/currency";
import { useCurrencies } from "@/lib/query/currencies";
import { cn } from "@/lib/utils";

export interface CurrencyFormFieldProps {
  name: string;
  label?: string;
  disabled?: boolean;
  hint?: string;
}

export const CurrencyFormField = ({
  name,
  label = "Moneda",
  disabled,
  hint,
}: CurrencyFormFieldProps) => {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const catalog = useCurrencies().data;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = String(field.value ?? "");
        const triggerContent = (
          <span className="flex min-w-0 items-center gap-2">
            <span className="bg-secondary text-ink2 flex h-6 min-w-10 items-center justify-center rounded-full px-2 text-[10.5px] font-semibold">
              {value}
            </span>
            <span className="truncate">{currencyName(value, catalog)}</span>
          </span>
        );
        const triggerClass = cn(
          "border-border bg-card flex h-10 w-full items-center justify-between gap-2 rounded-full border px-3.5 text-left text-[12.5px] shadow-none transition-colors",
          disabled && "text-muted-foreground cursor-not-allowed opacity-70",
        );

        return (
          <FormItem className="gap-1.5">
            <FormLabel className={FIELD_LABEL}>{label}</FormLabel>
            {isDesktop ? (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    className={triggerClass}
                  >
                    {triggerContent}
                    <ChevronDown
                      className="text-muted-foreground size-4"
                      aria-hidden
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-[360px] gap-0 p-2"
                >
                  <CurrencyPickerPanel
                    selected={value}
                    onSelect={(currency) => {
                      field.onChange(currency);
                      setOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setOpen(true)}
                  className={triggerClass}
                >
                  {triggerContent}
                  <ChevronDown
                    className="text-muted-foreground size-4"
                    aria-hidden
                  />
                </button>
                <CurrencyPickerSheet
                  open={open}
                  onOpenChange={setOpen}
                  selected={value}
                  onSelect={field.onChange}
                />
              </>
            )}
            {hint ? (
              <p className="text-muted-foreground text-[10.5px] leading-[14px]">
                {hint}
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

"use client";

import { Search, X } from "lucide-react";
import { SegmentedControl } from "@/components/common/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account, Category, PeriodRange } from "@/lib/api/types";
import type { PeriodPreset } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { TransactionTypeFilter } from "../filters";
import {
  AccountFilter,
  CategoryFilter,
  CurrencyFilter,
  FILTER_TRIGGER,
  PeriodFilter,
} from "./filter-selects";

const TYPE_OPTIONS: { value: TransactionTypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
  { value: "transfer", label: "Transferencias" },
];

export interface TransactionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: TransactionTypeFilter;
  onTypeChange: (value: TransactionTypeFilter) => void;
  accountId: string;
  onAccountChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  currencies: string[];
  preset: PeriodPreset;
  range: PeriodRange;
  onPresetChange: (value: PeriodPreset) => void;
  accounts: Account[];
  categories: Category[];
  hasActiveFilters: boolean;
  onClear: () => void;
}

export const TransactionFilters = ({
  search,
  onSearchChange,
  type,
  onTypeChange,
  accountId,
  onAccountChange,
  categoryId,
  onCategoryChange,
  currency,
  onCurrencyChange,
  currencies,
  preset,
  range,
  onPresetChange,
  accounts,
  categories,
  hasActiveFilters,
  onClear,
}: TransactionFiltersProps) => {
  const renderFilters = () => (
    <>
      <AccountFilter
        value={accountId}
        onChange={onAccountChange}
        accounts={accounts}
      />
      <CategoryFilter
        value={categoryId}
        onChange={onCategoryChange}
        categories={categories}
      />
      {currencies.length > 1 ? (
        <CurrencyFilter
          value={currency}
          onChange={onCurrencyChange}
          currencies={currencies}
        />
      ) : null}
      <PeriodFilter preset={preset} range={range} onChange={onPresetChange} />
    </>
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="hidden items-center gap-2.5 md:flex">
        <div className="relative w-full max-w-[300px]">
          <Search className="field-icon left-3.5 size-4" aria-hidden />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por concepto, nota o monto"
            className="border-border bg-card h-10 rounded-full pr-3.5 pl-9 text-[12.5px] shadow-none md:text-[12.5px]"
            aria-label="Buscar movimientos"
          />
        </div>

        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={onTypeChange}
          ariaLabel="Filtrar por tipo"
        />

        <div className="flex items-center gap-2.5">
          {renderFilters()}
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-10 px-2 text-[12px] leading-[16px] font-semibold"
              onClick={onClear}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3.5 md:hidden">
        <div className="relative">
          <Search className="field-icon left-[13px] size-[15px]" aria-hidden />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar movimiento"
            className="border-border bg-card h-[38px] rounded-full pr-4 pl-9 text-[11.5px] shadow-none"
            aria-label="Buscar movimientos"
          />
        </div>
        <div className="-mx-1 flex gap-[7px] overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Select
            value={type}
            onValueChange={(value) =>
              onTypeChange(value as TransactionTypeFilter)
            }
          >
            <SelectTrigger
              aria-label="Filtrar por tipo"
              className={cn(
                FILTER_TRIGGER,
                "[&_svg]:hidden!",
                type === "all"
                  ? "border-[#BBD6C2] bg-accent text-primary"
                  : "text-ink2",
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {renderFilters()}

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="border-border bg-card text-primary inline-flex h-[30px] shrink-0 items-center rounded-full border px-3 text-[11.5px] font-semibold transition-colors"
            >
              <X className="size-3" aria-hidden />
              Limpiar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

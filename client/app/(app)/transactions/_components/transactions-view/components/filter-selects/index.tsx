"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account, Category, PeriodRange } from "@/lib/api/types";
import {
  getPeriodLabel,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/period";
import { sortCategories } from "@/lib/categories";

const SELECT_TRIGGER =
  "bg-card border-border text-ink2 h-[30px]! w-fit gap-1 rounded-full px-[11px] py-0 text-[10.5px] leading-[14px] font-semibold shadow-none [&_svg]:size-[11px] md:h-10! md:gap-[7px] md:px-3.5 md:text-[12px] md:leading-[16px] md:font-medium md:[&_svg]:size-[14px]";

export { SELECT_TRIGGER as FILTER_TRIGGER };

export interface AccountFilterProps {
  value: string;
  onChange: (value: string) => void;
  accounts: Account[];
}

export const AccountFilter = ({
  value,
  onChange,
  accounts,
}: AccountFilterProps) => {
  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => onChange(next === "all" ? "" : next)}
    >
      <SelectTrigger aria-label="Filtrar por cuenta" className={SELECT_TRIGGER}>
        <SelectValue placeholder="Cuenta" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Cuenta</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
}

export const CategoryFilter = ({
  value,
  onChange,
  categories,
}: CategoryFilterProps) => {
  const options = sortCategories(categories);

  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => onChange(next === "all" ? "" : next)}
    >
      <SelectTrigger
        aria-label="Filtrar por categoría"
        className={SELECT_TRIGGER}
      >
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Categoría</SelectItem>
        {options.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export interface PeriodFilterProps {
  preset: PeriodPreset;
  range: PeriodRange;
  onChange: (value: PeriodPreset) => void;
}

export const PeriodFilter = ({
  preset,
  range,
  onChange,
}: PeriodFilterProps) => {
  const desktopLabel = getPeriodLabel(preset, range);
  const mobileLabel = getPeriodLabel(preset, range, "short");

  return (
    <Select
      value={preset}
      onValueChange={(value) => onChange(value as PeriodPreset)}
    >
      <SelectTrigger aria-label="Filtrar por fecha" className={SELECT_TRIGGER}>
        <Calendar
          className="text-muted-foreground size-3 md:size-[14px]"
          aria-hidden
        />
        <SelectValue>
          <span className="hidden md:inline">{desktopLabel}</span>
          <span className="md:hidden">{mobileLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PERIOD_PRESETS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

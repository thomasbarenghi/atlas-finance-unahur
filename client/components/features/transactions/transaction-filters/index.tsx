"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/common/date-picker";
import type { TransactionType } from "@/lib/api/types";
import type { TransactionFiltersProps } from "./transaction-filters.types";

export type { TransactionFilterState } from "./transaction-filters.types";

const ALL = "all";

const TYPE_OPTIONS: { value: TransactionType | ""; label: string }[] = [
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
  { value: "transfer", label: "Transferencia" },
];

export const TransactionFilters = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  accounts,
  categories,
}: TransactionFiltersProps) => {
  const hasFilters = Boolean(
    search ||
    filters.type ||
    filters.accountId ||
    filters.categoryId ||
    filters.from ||
    filters.to,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por descripción o notas"
          className="bg-muted/50 h-11 rounded-full border-0 pl-9"
          aria-label="Buscar movimientos"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={filters.type || ALL}
          onValueChange={(value) =>
            onFilterChange({
              type: value === ALL ? "" : (value as TransactionType),
            })
          }
        >
          <SelectTrigger aria-label="Tipo de movimiento">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.accountId || ALL}
          onValueChange={(value) =>
            onFilterChange({ accountId: value === ALL ? "" : value })
          }
        >
          <SelectTrigger aria-label="Cuenta">
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las cuentas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || ALL}
          onValueChange={(value) =>
            onFilterChange({ categoryId: value === ALL ? "" : value })
          }
        >
          <SelectTrigger aria-label="Categoría">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DatePicker
          value={filters.from || undefined}
          onChange={(from) => onFilterChange({ from })}
          placeholder="Desde"
          className="h-9"
        />

        <DatePicker
          value={filters.to || undefined}
          onChange={(to) => onFilterChange({ to })}
          placeholder="Hasta"
          className="h-9"
        />
      </div>

      {hasFilters ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <X />
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
};

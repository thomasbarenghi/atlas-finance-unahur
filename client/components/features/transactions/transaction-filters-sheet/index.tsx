"use client";

import { ListFilter, X } from "lucide-react";
import { DatePicker } from "@/components/common/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { TransactionType } from "@/lib/api/types";
import type { TransactionFiltersSheetProps } from "./transaction-filters-sheet.types";

const ALL = "all";

const TYPE_OPTIONS: { value: TransactionType | ""; label: string }[] = [
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
  { value: "transfer", label: "Transferencia" },
];

export const TransactionFiltersSheet = ({
  filters,
  onFilterChange,
  onClear,
  accounts,
  categories,
  activeCount,
}: TransactionFiltersSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Filtros"
          className="relative"
        >
          <ListFilter />
          {activeCount > 0 ? (
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-6 pb-6">
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

          {activeCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-end"
              onClick={onClear}
            >
              <X />
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};

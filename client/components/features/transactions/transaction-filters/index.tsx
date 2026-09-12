"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TransactionFiltersProps } from "./transaction-filters.types";

export const TransactionFilters = ({
  search,
  onSearchChange,
}: TransactionFiltersProps) => {
  return (
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
  );
};

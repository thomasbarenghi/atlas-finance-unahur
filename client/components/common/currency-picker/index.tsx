"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { DialogShell } from "@/components/common/dialog-shell";
import { Input } from "@/components/ui/input";
import { useCurrencies } from "@/lib/query/currencies";
import { cn } from "@/lib/utils";

export interface CurrencyPickerPanelProps {
  selected?: string;
  onSelect: (currency: string) => void;
}

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const CurrencyPickerPanel = ({
  selected,
  onSelect,
}: CurrencyPickerPanelProps) => {
  const currenciesQuery = useCurrencies();
  const [search, setSearch] = useState("");
  const catalog = useMemo(
    () => currenciesQuery.data ?? [],
    [currenciesQuery.data],
  );

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return catalog;
    return catalog.filter(
      (item) =>
        normalize(item.code).includes(term) ||
        normalize(item.name).includes(term),
    );
  }, [catalog, search]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="field-icon left-3 size-[15px]" aria-hidden />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar moneda o código"
          aria-label="Buscar moneda"
          autoFocus
          className="h-9 rounded-full pr-3 pl-9 text-[12px]"
        />
      </div>

      <ul className="border-line2 max-h-[250px] overflow-y-auto rounded-xl border">
        {currenciesQuery.isLoading ? (
          <li className="text-muted-foreground px-3 py-5 text-center text-[11.5px]">
            Cargando monedas…
          </li>
        ) : filtered.length === 0 ? (
          <li className="text-muted-foreground px-3 py-5 text-center text-[11.5px]">
            No encontramos esa moneda.
          </li>
        ) : (
          filtered.map((item) => {
            const active = item.code === selected;
            return (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => onSelect(item.code)}
                  className={cn(
                    "hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    active && "bg-accent/60",
                  )}
                >
                  <span className="bg-secondary text-ink2 flex h-7 min-w-10 shrink-0 items-center justify-center rounded-full px-2 text-[10px] font-semibold">
                    {item.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium">
                    {item.name}
                  </span>
                  {active ? (
                    <Check className="text-primary size-3.5" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export interface CurrencyPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: string;
  onSelect: (currency: string) => void;
}

/** Mobile keeps the bottom sheet (CH-66); desktop uses an anchored popover. */
export const CurrencyPickerSheet = ({
  open,
  onOpenChange,
  selected,
  onSelect,
}: CurrencyPickerSheetProps) => {
  const choose = (currency: string) => {
    onSelect(currency);
    onOpenChange(false);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Elegir moneda"
      description="Buscá por código o nombre. Podés tener cuentas en cualquier moneda."
      contentClassName="sm:max-w-[520px]"
    >
      <div className="dialog-body !pb-[18px] sm:!pb-[22px]">
        <CurrencyPickerPanel selected={selected} onSelect={choose} />
      </div>
    </DialogShell>
  );
};

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useCurrencies } from "@/lib/query/reference";

export const CurrencySelector = () => {
  const { currency, setCurrency } = useDisplayCurrency();
  const currencies = useCurrencies();

  const supported = currencies.data?.supported ?? [currency];

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger size="sm" aria-label="Moneda de visualización">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supported.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

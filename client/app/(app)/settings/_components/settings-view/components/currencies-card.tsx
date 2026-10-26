"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { useAccounts } from "@/lib/query/accounts";
import { useCurrencies } from "@/lib/query/currencies";
import { useUpdateMe } from "@/lib/query/users";
import { SettingsCard } from "./settings-card";

export const CurrenciesCard = () => {
  const { user } = useAuth();
  const accounts = useAccounts().data ?? [];
  const catalog = useCurrencies().data ?? [];
  const updateMe = useUpdateMe();
  const primaryCurrency = user?.primaryCurrency ?? "ARS";
  const hasForeignAccounts =
    new Set(accounts.map((account) => account.currency)).size > 1;

  if (!hasForeignAccounts) return null;

  const options = catalog.length
    ? catalog
    : [
        {
          code: primaryCurrency,
          name: primaryCurrency,
          symbol: primaryCurrency,
          decimals: 2,
        },
      ];

  const changePrimary = async (currency: string) => {
    if (currency === primaryCurrency) return;
    try {
      await updateMe.mutateAsync({ primaryCurrency: currency });
      toast.success("Moneda principal actualizada");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cambiar la moneda"));
    }
  };

  return (
    <SettingsCard
      title="Monedas y cotización"
      description="La moneda principal se usa para informar el patrimonio. Las cotizaciones vienen de la API."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-px">
          <span className="text-ink2 text-[12.5px] leading-[17px] font-semibold">
            Moneda principal
          </span>
          <span className="text-muted-foreground text-[10.5px] leading-[14px]">
            Todo el patrimonio se informa en esta moneda.
          </span>
        </div>
        <Select
          value={primaryCurrency}
          onValueChange={changePrimary}
          disabled={updateMe.isPending}
        >
          <SelectTrigger
            aria-label="Moneda principal"
            className="bg-card border-border h-[34px]! w-fit gap-1 rounded-full px-3 text-[11.5px] font-semibold shadow-none"
          >
            {updateMe.isPending ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : null}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.code} · {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SettingsCard>
  );
};

"use client";

import { useState } from "react";
import { Coins, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IconBadge } from "@/components/common/icon-badge";
import { ListRow } from "@/components/common/list-row";
import { OptionSheet } from "@/components/common/option-sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useSignOut } from "@/hooks/use-sign-out";
import { useCurrencies } from "@/lib/query/reference";
import { useUpdateMe } from "@/lib/query/users";

export const SettingsMenu = () => {
  const { user } = useAuth();
  const { signOut } = useSignOut();
  const currencies = useCurrencies();
  const updateMe = useUpdateMe();

  const [currencyOpen, setCurrencyOpen] = useState(false);

  const supported = currencies.data?.supported ?? [user?.baseCurrency ?? "ARS"];

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border">
        <div className="border-b">
          <ListRow
            icon={Coins}
            label="Moneda base"
            value={user?.baseCurrency}
            onClick={() => setCurrencyOpen(true)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <IconBadge icon={Sparkles} size="sm" shape="lg" />
          <span className="flex-1 text-sm font-medium">Asistente de IA</span>
          <Switch
            checked={user?.aiEnabled ?? false}
            disabled={updateMe.isPending}
            aria-label="Asistente de IA"
            onCheckedChange={(checked) =>
              updateMe.mutate(
                { aiEnabled: checked },
                { onError: () => toast.error("No se pudo actualizar") },
              )
            }
          />
        </div>
        <div className="flex items-center gap-3 border-t px-4 py-2.5">
          <IconBadge icon={ShieldAlert} size="sm" shape="lg" />
          <span className="flex-1 text-sm font-medium">
            Acciones destructivas
          </span>
          <Switch
            checked={user?.assistantDestructiveEnabled ?? false}
            disabled={updateMe.isPending || !user?.aiEnabled}
            aria-label="Acciones destructivas del asistente"
            onCheckedChange={(checked) =>
              updateMe.mutate(
                { assistantDestructiveEnabled: checked },
                { onError: () => toast.error("No se pudo actualizar") },
              )
            }
          />
        </div>
      </section>

      <Button
        variant="outline"
        onClick={signOut}
        className="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive h-11 w-full rounded-2xl"
      >
        <LogOut /> Cerrar sesión
      </Button>

      <OptionSheet
        open={currencyOpen}
        onOpenChange={setCurrencyOpen}
        title="Moneda base"
        options={supported.map((currency) => ({
          value: currency,
          label: currency,
        }))}
        value={user?.baseCurrency ?? "ARS"}
        onSelect={(baseCurrency) =>
          updateMe.mutate(
            { baseCurrency },
            {
              onSuccess: () => toast.success("Moneda base actualizada"),
              onError: () => toast.error("No se pudo cambiar la moneda"),
            },
          )
        }
      />
    </div>
  );
};

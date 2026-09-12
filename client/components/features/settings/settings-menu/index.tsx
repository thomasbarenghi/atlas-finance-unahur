"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Coins, LogOut, Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IconBadge } from "@/components/common/icon-badge";
import { ListRow } from "@/components/common/list-row";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogContent } from "@/components/common/responsive-dialog";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-mounted";
import type { Theme } from "@/lib/api/types";
import { useCurrencies } from "@/lib/query/reference";
import { useUpdateMe } from "@/lib/query/users";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Automático" },
];

const THEME_LABELS: Record<Theme, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Automático",
};

interface OptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}

const OptionSheet = ({
  open,
  onOpenChange,
  title,
  options,
  value,
  onSelect,
}: OptionSheetProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <ResponsiveDialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Elegí una opción.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSelect(option.value);
              onOpenChange(false);
            }}
            className={cn(
              "hover:bg-muted/50 flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm",
              option.value === value && "text-primary font-medium",
            )}
          >
            {option.label}
            {option.value === value ? (
              <span className="bg-primary size-2 rounded-full" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>
    </ResponsiveDialogContent>
  </Dialog>
);

export const SettingsMenu = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const currencies = useCurrencies();
  const updateMe = useUpdateMe();

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const supported = currencies.data?.supported ?? [user?.baseCurrency ?? "ARS"];
  const themeValue = (theme ?? "system") as Theme;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  };

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
        <div className="border-b">
          <ListRow
            icon={Moon}
            label="Tema"
            value={mounted ? THEME_LABELS[themeValue] : undefined}
            onClick={() => setThemeOpen(true)}
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
      </section>

      <Button
        variant="outline"
        onClick={handleSignOut}
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
      <OptionSheet
        open={themeOpen}
        onOpenChange={setThemeOpen}
        title="Tema"
        options={THEME_OPTIONS}
        value={themeValue}
        onSelect={(value) => {
          const next = value as Theme;
          setTheme(next);
          updateMe.mutate(
            { theme: next },
            { onError: () => toast.error("No se pudo guardar el tema") },
          );
        }}
      />
    </div>
  );
};

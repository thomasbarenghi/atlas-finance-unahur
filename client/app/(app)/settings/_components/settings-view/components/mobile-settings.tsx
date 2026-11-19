"use client";

import { Check, Download, Loader2, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { FormShell } from "@/components/common/form-shell";
import { MenuRow } from "@/components/common/menu-row";
import { PRIMARY_ACTION_BUTTON } from "@/components/common/ui-classes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useExportTransactions } from "@/hooks/use-export-transactions";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";
import { THEMES, type ThemePreference } from "../themes";
import { useSettingsForm } from "../hooks/use-settings-form";
import { MobileCurrenciesDialog } from "./mobile-currencies-dialog";
import { PasswordCard } from "./password-card";
import { ProfileCard } from "./profile-card";

export const MobileSettings = () => {
  const { user, form, onSubmit, isPending, isDirty } = useSettingsForm();
  const { theme, setTheme } = useTheme();
  const { signOut, isSigningOut } = useSignOut();
  const { exportTransactions } = useExportTransactions();
  const value = (theme ?? "light") as ThemePreference;
  const themeLabel =
    THEMES.find((option) => option.value === value)?.label ?? "Claro";

  return (
    <div className="flex flex-col gap-3.5">
      <FormShell
        id="mobile-settings-form"
        form={form}
        onSubmit={onSubmit}
        className="gap-3"
      >
        <ProfileCard user={user} />
        <Button
          type="submit"
          disabled={!isDirty || isPending}
          className={cn(PRIMARY_ACTION_BUTTON, "w-full")}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Guardar cambios
        </Button>
      </FormShell>

      <PasswordCard />

      <section className="surface-list py-1">
        <div className="flex h-[50px] items-center gap-2.5 px-3.5">
          <span className="text-ink flex-1 text-[12.5px] leading-[17px] font-medium">
            Tema
          </span>
          <Select
            value={value}
            onValueChange={(next) => setTheme(next as ThemePreference)}
          >
            <SelectTrigger
              aria-label="Tema"
              className="text-muted-foreground h-[30px]! w-fit gap-0 rounded-full border-0 bg-transparent px-1 py-0 text-[11px] leading-[15px] font-normal shadow-none [&_svg]:hidden"
            >
              <SelectValue>{themeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="surface-list py-1">
        <MobileCurrenciesDialog />
      </section>

      <section className="surface-list py-1">
        <MenuRow
          icon={Download}
          label="Exportar movimientos (CSV)"
          onClick={() => exportTransactions()}
        />
      </section>

      <section className="surface-list">
        <MenuRow
          icon={LogOut}
          label="Cerrar sesión"
          onClick={signOut}
          disabled={isSigningOut}
          tone="destructive"
        />
      </section>
    </div>
  );
};

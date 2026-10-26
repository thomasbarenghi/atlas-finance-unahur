"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Download, LogOut, Pencil } from "lucide-react";
import { MenuRow } from "@/components/common/menu-row";
import { UserIdentity } from "@/components/layout/user-identity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useExportTransactions } from "@/hooks/use-export-transactions";
import { useSignOut } from "@/hooks/use-sign-out";
import { THEMES, type ThemePreference } from "../themes";
import { MobileCurrenciesDialog } from "./mobile-currencies-dialog";

export const MobileSettings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { signOut, isSigningOut } = useSignOut();
  const { exportTransactions } = useExportTransactions();
  const value = (theme ?? "light") as ThemePreference;
  const themeLabel =
    THEMES.find((option) => option.value === value)?.label ?? "Claro";

  return (
    <div className="flex flex-col gap-3.5">
      <section className="surface-card flex items-center gap-3 p-3.5">
        <UserIdentity
          name={user?.name}
          email={user?.email}
          className="flex-1"
        />
        <Link
          href="/profile"
          aria-label="Editar perfil"
          className="border-line text-ink2 flex size-8 items-center justify-center rounded-full border"
        >
          <Pencil className="size-[15px]" aria-hidden />
        </Link>
      </section>

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

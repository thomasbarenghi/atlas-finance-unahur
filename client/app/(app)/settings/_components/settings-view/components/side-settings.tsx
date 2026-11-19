"use client";

import { Download, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useExportTransactions } from "@/hooks/use-export-transactions";
import { useSignOut } from "@/hooks/use-sign-out";
import { SettingsCard } from "./settings-card";

export const SideSettings = () => {
  const { user } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const { exportTransactions } = useExportTransactions();

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="order-2 lg:order-1">
        <SettingsCard title="Sesión" dense>
          <p className="text-muted-foreground text-[10.5px] leading-[14px]">
            Estás conectado como {user?.name}. Cerrando sesión se limpian los
            filtros guardados.
          </p>
          <button
            type="button"
            disabled={isSigningOut}
            onClick={signOut}
            className="text-expense hover:bg-destructive/5 flex h-9 w-full items-center justify-center gap-[7px] rounded-full border border-[#E7C9C4] text-[11.5px] leading-[16px] font-semibold transition-colors disabled:opacity-60"
          >
            <LogOut className="size-[14px]" aria-hidden />
            Cerrar sesión
          </button>
        </SettingsCard>
      </div>

      <div className="order-1 lg:order-2">
        <SettingsCard title="Datos" dense>
          <button
            type="button"
            onClick={() => exportTransactions()}
            className="hover:bg-muted/50 flex h-[34px] w-full items-center gap-[7px] rounded-lg px-2 text-left text-[11.5px] leading-[16px] font-semibold transition-colors"
          >
            <Download
              className="text-muted-foreground size-[14px]"
              aria-hidden
            />
            Exportar movimientos (CSV)
          </button>
        </SettingsCard>
      </div>
    </div>
  );
};

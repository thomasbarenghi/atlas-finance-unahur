"use client";

import { LogOut, Settings, Tags } from "lucide-react";
import { MenuRow } from "@/components/common/menu-row";
import { UserIdentity } from "@/components/layout/user-identity";
import { useAuth } from "@/hooks/use-auth";
import { useSignOut } from "@/hooks/use-sign-out";
import { SECTIONS } from "@/lib/sections";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { useTransactions } from "@/lib/query/transactions";

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-px">
    <span className="text-muted-foreground text-[9.5px] leading-[13px]">
      {label}
    </span>
    <span className="font-heading text-ink text-[14px] leading-[18px] font-semibold tabular-nums">
      {value}
    </span>
  </div>
);

export const ProfileMenu = () => {
  const { user } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const accounts = useAccounts().data ?? [];
  const categories = useCategories().data ?? [];
  const transactions = useTransactions({ page: 1, pageSize: 100 }).data;

  return (
    <div className="flex flex-col gap-3.5">
      <section className="surface-card flex flex-col gap-3 p-4">
        <UserIdentity name={user?.name} email={user?.email} />

        <div className="border-line2 grid grid-cols-3 gap-0 border-t pt-2.5">
          <Stat label="Cuentas" value={accounts.length} />
          <Stat label="Movimientos" value={transactions?.items.length ?? 0} />
          <Stat label="Categorías" value={categories.length} />
        </div>
      </section>

      <section className="surface-list py-1">
        <MenuRow
          href={SECTIONS.categories.href}
          icon={Tags}
          label="Categorías"
          bordered
        />
        <MenuRow
          href={SECTIONS.settings.href}
          icon={Settings}
          label="Ajustes"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Moon } from "lucide-react";
import { toast } from "sonner";
import { ListRow } from "@/components/common/list-row";
import { OptionSheet } from "@/components/common/option-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-mounted";
import type { Theme } from "@/lib/api/types";
import { useUpdateMe } from "@/lib/query/users";
import { SECTIONS, type AppSection } from "@/lib/sections";

const FINANCE_LINKS: AppSection[] = [SECTIONS.budgets, SECTIONS.categories];

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

const initialsFrom = (name: string | undefined): string => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const ProfileMenu = () => {
  const { user, signOut, isSigningOut } = useAuth();
  const router = useRouter();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const updateMe = useUpdateMe();

  const [themeOpen, setThemeOpen] = useState(false);

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
      <div className="from-primary/15 to-background flex items-center gap-3 rounded-3xl border bg-gradient-to-br p-4">
        <span className="bg-primary text-primary-foreground font-heading flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
          {initialsFrom(user?.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-heading truncate text-base font-semibold">
            {user?.name}
          </span>
          <span className="text-muted-foreground truncate text-sm">
            {user?.email}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border">
        {FINANCE_LINKS.map((item) => (
          <div key={item.href} className="border-b last:border-b-0">
            <ListRow {...item} />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border">
        <ListRow
          icon={Moon}
          label="Tema"
          value={mounted ? THEME_LABELS[themeValue] : undefined}
          onClick={() => setThemeOpen(true)}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border">
        <ListRow {...SECTIONS.settings} />
      </section>

      <section className="overflow-hidden rounded-2xl border">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-destructive hover:bg-destructive/5 flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-60"
        >
          <span className="bg-destructive/10 text-destructive flex size-8 shrink-0 items-center justify-center rounded-lg">
            <LogOut className="size-4" aria-hidden />
          </span>
          Cerrar sesión
        </button>
      </section>

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

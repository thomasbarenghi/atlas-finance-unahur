"use client";

import { LogOut } from "lucide-react";
import { DataListItem } from "@/components/common/data-list-item";
import { IconBadge } from "@/components/common/icon-badge";
import { useAuth } from "@/hooks/use-auth";
import { useSignOut } from "@/hooks/use-sign-out";
import { SECTIONS } from "@/lib/sections";
import { SECTION_ICONS } from "@/components/layout/section-icons";

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
  const { user } = useAuth();
  const { signOut, isSigningOut } = useSignOut();

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
        <DataListItem
          href={SECTIONS.categories.href}
          leading={
            <IconBadge icon={SECTION_ICONS.categories} size="sm" shape="lg" />
          }
          title={SECTIONS.categories.label}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border">
        <DataListItem
          href={SECTIONS.settings.href}
          leading={
            <IconBadge icon={SECTION_ICONS.settings} size="sm" shape="lg" />
          }
          title={SECTIONS.settings.label}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border">
        <button
          type="button"
          onClick={signOut}
          disabled={isSigningOut}
          className="text-destructive hover:bg-destructive/5 flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-60"
        >
          <span className="bg-destructive/10 text-destructive flex size-8 shrink-0 items-center justify-center rounded-lg">
            <LogOut className="size-4" aria-hidden />
          </span>
          Cerrar sesión
        </button>
      </section>
    </div>
  );
};

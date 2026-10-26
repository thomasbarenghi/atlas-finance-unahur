"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/components/layout/app-nav";
import { cn } from "@/lib/utils";

export const MobileTabBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-background/95 supports-backdrop-filter:bg-background/70 fixed inset-x-3 bottom-4 z-40 flex items-center rounded-3xl border px-2 py-1 shadow-lg backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 items-center justify-center rounded-xl py-3 transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {active ? (
              <span
                className="bg-primary absolute bottom-1.5 size-1 rounded-full"
                aria-hidden
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
};

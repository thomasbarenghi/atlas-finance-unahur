"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV_ITEMS } from "@/components/layout/app-nav";
import { isSectionActive } from "@/lib/sections";
import { cn } from "@/lib/utils";

export const MobileTabBar = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-4 z-40 md:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="bg-card border-border flex h-[58px] items-center rounded-full border p-1.5 shadow-lg">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isSectionActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex h-full flex-1 items-center justify-center"
            >
              <span
                className={cn(
                  "flex h-11 w-fit min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-2.5 transition-colors",
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                <span
                  className={cn(
                    "text-[9.5px] leading-none whitespace-nowrap",
                    active ? "font-bold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

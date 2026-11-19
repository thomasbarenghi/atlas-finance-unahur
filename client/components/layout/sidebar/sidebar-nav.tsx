"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/app-nav";
import { isSectionActive } from "@/lib/sections";
import { cn } from "@/lib/utils";

export const SidebarNav = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isSectionActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[38px] items-center gap-2.5 rounded-[8px] px-2.5 text-[13.5px] leading-[18px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "bg-sidebar-accent text-primary font-semibold"
                : "text-ink2 hover:bg-muted font-medium",
            )}
          >
            <Icon className="size-[17px] shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

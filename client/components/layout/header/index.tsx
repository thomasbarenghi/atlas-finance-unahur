"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { CurrencySelector } from "@/components/common/currency-selector";
import { PeriodSelector } from "@/components/common/period-selector";
import { UserMenu } from "./user-menu";

const SELECTOR_ROUTES = ["/dashboard", "/reports"];

export const Header = () => {
  const pathname = usePathname();
  const showSelectors = SELECTOR_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/70 sticky top-0 z-30 hidden items-center gap-3 border-b px-4 py-3 backdrop-blur md:flex">
      {showSelectors ? <PeriodSelector /> : null}
      <div className="ml-auto flex items-center gap-2">
        {showSelectors ? <CurrencySelector /> : null}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
};

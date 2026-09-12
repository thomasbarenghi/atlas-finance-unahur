"use client";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { CurrencySelector } from "@/components/common/currency-selector";
import { UserMenu } from "./user-menu";

export const Header = () => {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/70 sticky top-0 z-30 hidden items-center gap-3 border-b px-4 py-3 backdrop-blur md:flex">
      <div className="ml-auto flex items-center gap-2">
        <CurrencySelector />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
};

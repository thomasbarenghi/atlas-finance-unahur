"use client";

import { CurrencySelector } from "@/components/common/currency-selector";
import { PeriodSelector } from "@/components/common/period-selector";

export const PeriodCurrencyFilters = () => {
  return (
    <div className="flex items-center gap-2">
      <PeriodSelector />
      <div className="md:hidden">
        <CurrencySelector />
      </div>
    </div>
  );
};

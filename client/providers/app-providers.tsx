"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { PeriodProvider } from "@/providers/period-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ReadingCurrencyProvider } from "@/providers/reading-currency-provider";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryProvider>
      <AuthProvider>
        <PeriodProvider>
          <ReadingCurrencyProvider>
            {children}
            <Toaster />
          </ReadingCurrencyProvider>
        </PeriodProvider>
      </AuthProvider>
    </QueryProvider>
  );
};

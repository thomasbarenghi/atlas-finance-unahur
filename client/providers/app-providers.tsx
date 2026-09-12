"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { DisplayCurrencyProvider } from "@/providers/display-currency-provider";
import { PeriodProvider } from "@/providers/period-provider";
import { QueryProvider } from "@/providers/query-provider";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryProvider>
      <AuthProvider>
        <DisplayCurrencyProvider>
          <PeriodProvider>
            {children}
            <Toaster />
          </PeriodProvider>
        </DisplayCurrencyProvider>
      </AuthProvider>
    </QueryProvider>
  );
};

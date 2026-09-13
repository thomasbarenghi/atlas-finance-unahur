"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DisplayCurrencyContext } from "@/hooks/use-display-currency";

export const DisplayCurrencyProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();
  const currency = user?.baseCurrency ?? "ARS";

  const value = useMemo(() => ({ currency }), [currency]);

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
};

"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DisplayCurrencyContext } from "@/hooks/use-display-currency";

export const DisplayCurrencyProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();
  const [override, setOverride] = useState<string | null>(null);

  const currency = override ?? user?.baseCurrency ?? "ARS";

  const value = useMemo(
    () => ({ currency, setCurrency: setOverride }),
    [currency],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
};

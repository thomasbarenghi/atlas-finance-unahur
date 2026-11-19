"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ReadingCurrencyContext } from "@/hooks/use-reading-currency";

/**
 * Comparte la moneda de lectura elegida en el dashboard con el resto de las
 * vistas (por ejemplo, el asistente). Vive solo en memoria del cliente: al
 * recargar se vuelve a la moneda principal.
 */
export const ReadingCurrencyProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currency, setCurrency] = useState<string | undefined>(undefined);
  const value = useMemo(() => ({ currency, setCurrency }), [currency]);

  return (
    <ReadingCurrencyContext.Provider value={value}>
      {children}
    </ReadingCurrencyContext.Provider>
  );
};

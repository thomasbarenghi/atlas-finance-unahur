"use client";

import { createContext, useContext } from "react";

export interface ReadingCurrencyContextValue {
  /** Moneda de lectura activa; `undefined` usa la principal del usuario. */
  currency?: string;
  setCurrency: (currency?: string) => void;
}

export const ReadingCurrencyContext =
  createContext<ReadingCurrencyContextValue | null>(null);

export const useReadingCurrency = (): ReadingCurrencyContextValue => {
  const context = useContext(ReadingCurrencyContext);
  if (!context) {
    throw new Error(
      "useReadingCurrency debe usarse dentro de ReadingCurrencyProvider",
    );
  }
  return context;
};

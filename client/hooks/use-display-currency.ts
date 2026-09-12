"use client";

import { createContext, useContext } from "react";

export interface DisplayCurrencyContextValue {
  currency: string;
}

export const DisplayCurrencyContext =
  createContext<DisplayCurrencyContextValue | null>(null);

export const useDisplayCurrency = (): DisplayCurrencyContextValue => {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    throw new Error(
      "useDisplayCurrency debe usarse dentro de DisplayCurrencyProvider",
    );
  }
  return context;
};

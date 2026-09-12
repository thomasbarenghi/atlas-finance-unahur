"use client";

import { createContext, useContext } from "react";

export interface AssistantPanelContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const AssistantPanelContext =
  createContext<AssistantPanelContextValue | null>(null);

export const useAssistantPanel = (): AssistantPanelContextValue => {
  const context = useContext(AssistantPanelContext);
  if (!context) {
    throw new Error(
      "useAssistantPanel debe usarse dentro de AssistantPanelProvider",
    );
  }
  return context;
};

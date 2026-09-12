"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AssistantPanelContext } from "@/hooks/use-assistant-panel";

export const AssistantPanelProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((previous) => !previous),
    }),
    [isOpen],
  );

  return (
    <AssistantPanelContext.Provider value={value}>
      {children}
    </AssistantPanelContext.Provider>
  );
};

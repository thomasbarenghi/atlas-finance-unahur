"use client";

import { useState, useSyncExternalStore } from "react";

const REMEMBER_KEY = "atlassfin.auth.rememberEmail";

const readRememberedEmail = (): string => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REMEMBER_KEY) ?? "";
};

const getServerRememberedEmail = (): string => "";

const subscribeToRememberedEmail = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
};

export const useRememberedEmail = () => {
  const storedEmail = useSyncExternalStore(
    subscribeToRememberedEmail,
    readRememberedEmail,
    getServerRememberedEmail,
  );
  const [rememberOverride, setRememberOverride] = useState<boolean | null>(
    null,
  );

  return {
    storedEmail,
    remember: rememberOverride ?? storedEmail !== "",
    setRemember: (value: boolean) => setRememberOverride(value),
    persist: (email: string | null) => {
      if (email) window.localStorage.setItem(REMEMBER_KEY, email);
      else window.localStorage.removeItem(REMEMBER_KEY);
    },
  };
};

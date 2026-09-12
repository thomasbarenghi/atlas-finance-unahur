"use client";

import { createContext, useContext } from "react";
import type { User } from "@/lib/api/types";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isSigningOut: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

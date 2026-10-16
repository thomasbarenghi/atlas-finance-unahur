"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useLogout, useMe } from "@/lib/query/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const meQuery = useMe();
  const logout = useLogout();

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      isSigningOut: logout.isPending,
      signOut: () => logout.mutateAsync(),
    }),
    [meQuery.data, meQuery.isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { AuthContext } from "@/hooks/use-auth";
import { useLogout, useMe } from "@/lib/query/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const meQuery = useMe();
  const logout = useLogout();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (meQuery.data?.theme) {
      setTheme(meQuery.data.theme);
    }
  }, [meQuery.data?.theme, setTheme]);

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

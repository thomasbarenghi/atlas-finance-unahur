"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/common/page-loader";
import { useAuth } from "@/hooks/use-auth";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

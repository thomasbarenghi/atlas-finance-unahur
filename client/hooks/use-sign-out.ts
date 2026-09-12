"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export interface UseSignOutOptions {
  successMessage?: string;
}

export interface UseSignOutResult {
  signOut: () => Promise<void>;
  isSigningOut: boolean;
}

export const useSignOut = ({
  successMessage,
}: UseSignOutOptions = {}): UseSignOutResult => {
  const { signOut: endSession, isSigningOut } = useAuth();
  const router = useRouter();

  const signOut = useCallback(async () => {
    try {
      await endSession();
      if (successMessage) toast.success(successMessage);
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  }, [endSession, router, successMessage]);

  return { signOut, isSigningOut };
};

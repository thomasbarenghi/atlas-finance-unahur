import type { PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSignOut } from "@/hooks/use-sign-out";
import { AuthContext, type AuthContextValue } from "@/hooks/use-auth";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { replace, resetNavigationMocks } from "@/lib/test/next-navigation";

const createWrapper = (value: AuthContextValue) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
  return Wrapper;
};

describe("useSignOut", () => {
  beforeEach(() => {
    resetNavigationMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("ends the session, notifies and redirects to login", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(
      () => useSignOut({ successMessage: "Chau" }),
      {
        wrapper: createWrapper({
          user: null,
          isLoading: false,
          isSigningOut: false,
          signOut,
        }),
      },
    );

    await result.current.signOut();

    expect(signOut).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Chau");
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows an error and does not redirect when signing out fails", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useSignOut(), {
      wrapper: createWrapper({
        user: null,
        isLoading: false,
        isSigningOut: false,
        signOut,
      }),
    });

    await result.current.signOut();

    expect(toast.error).toHaveBeenCalledWith("No se pudo cerrar la sesión");
    expect(replace).not.toHaveBeenCalled();
  });
});

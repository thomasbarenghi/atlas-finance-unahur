import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useConfirmAction } from "@/hooks/use-confirm-action";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useConfirmAction", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("runs the action on confirm, shows success and clears the target", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useConfirmAction<string>({
        run,
        successMessage: (target) => `Hecho: ${target}`,
        errorMessage: "Falló",
        onSuccess,
      }),
    );

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.request("item-1"));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.target).toBe("item-1");

    act(() => result.current.confirm());

    await waitFor(() => expect(run).toHaveBeenCalledWith("item-1"));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Hecho: item-1"),
    );
    expect(onSuccess).toHaveBeenCalledWith("item-1");
    await waitFor(() => expect(result.current.target).toBeNull());
    expect(result.current.isPending).toBe(false);
  });

  it("uses the API error message when the action fails", async () => {
    const run = vi.fn().mockRejectedValue({
      statusCode: 409,
      code: "CONFLICT",
      message: "Duplicado",
    });
    const { result } = renderHook(() =>
      useConfirmAction<string>({
        run,
        successMessage: "ok",
        errorMessage: "Falló",
      }),
    );

    act(() => result.current.request("item-1"));
    act(() => result.current.confirm());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Duplicado"));
    expect(toast.success).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("falls back to the provided message when the error has no message", async () => {
    const run = vi.fn().mockRejectedValue(new Error());
    const { result } = renderHook(() =>
      useConfirmAction<string>({
        run,
        successMessage: "ok",
        errorMessage: "No se pudo archivar",
      }),
    );

    act(() => result.current.request("x"));
    act(() => result.current.confirm());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo archivar"),
    );
  });

  it("does nothing when confirming without a target and can be cleared", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useConfirmAction<string>({
        run,
        successMessage: "ok",
        errorMessage: "err",
      }),
    );

    act(() => result.current.confirm());
    expect(run).not.toHaveBeenCalled();

    act(() => result.current.request("x"));
    act(() => result.current.clear());
    expect(result.current.isOpen).toBe(false);
  });
});

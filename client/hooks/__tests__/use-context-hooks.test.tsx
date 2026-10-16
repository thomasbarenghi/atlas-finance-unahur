import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { useAssistantPanel } from "@/hooks/use-assistant-panel";

describe("context hooks", () => {
  it("useAuth throws a descriptive error outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
    spy.mockRestore();
  });

  it("usePeriod throws a descriptive error outside PeriodProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => usePeriod())).toThrow(/PeriodProvider/);
    spy.mockRestore();
  });

  it("useDisplayCurrency returns the single system currency", () => {
    const { result } = renderHook(() => useDisplayCurrency());
    expect(result.current.currency).toBe("ARS");
  });

  it("useAssistantChat throws outside AssistantChatProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAssistantChat())).toThrow(
      /AssistantChatProvider/,
    );
    spy.mockRestore();
  });

  it("useAssistantPanel throws outside AssistantPanelProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAssistantPanel())).toThrow(
      /AssistantPanelProvider/,
    );
    spy.mockRestore();
  });
});

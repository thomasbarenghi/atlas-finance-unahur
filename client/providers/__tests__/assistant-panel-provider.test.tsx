import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssistantPanelProvider } from "@/providers/assistant-panel-provider";
import { useAssistantPanel } from "@/hooks/use-assistant-panel";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AssistantPanelProvider>{children}</AssistantPanelProvider>
);

describe("AssistantPanelProvider", () => {
  it("opens, closes and toggles the assistant panel", () => {
    const { result } = renderHook(() => useAssistantPanel(), { wrapper });
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });
});

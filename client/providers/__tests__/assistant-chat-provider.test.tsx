import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { useAssistantChat } from "@/hooks/use-assistant-chat";

const STORAGE_KEY = "atlassfin.assistant.threads.v3";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AssistantChatProvider>{children}</AssistantChatProvider>
);

describe("AssistantChatProvider / useAssistantChat", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("creates a thread from the first message and appends to it", () => {
    const { result } = renderHook(() => useAssistantChat(), { wrapper });

    act(() =>
      result.current.appendMessage({
        id: "u1",
        role: "user",
        content: "¿Cuánto gasté?",
      }),
    );
    expect(result.current.threads).toHaveLength(1);
    expect(result.current.activeThread?.title).toBe("¿Cuánto gasté?");

    act(() =>
      result.current.appendMessage({
        id: "a1",
        role: "assistant",
        content: "",
      }),
    );
    expect(result.current.activeThread?.messages).toHaveLength(2);
    expect(result.current.threads).toHaveLength(1);
  });

  it("updates messages and manages threads", () => {
    const { result } = renderHook(() => useAssistantChat(), { wrapper });

    act(() =>
      result.current.appendMessage({ id: "u1", role: "user", content: "Hola" }),
    );
    const threadId = result.current.activeThread!.id;

    act(() => result.current.updateMessage("u1", { content: "Actualizado" }));
    expect(result.current.activeThread?.messages[0].content).toBe(
      "Actualizado",
    );

    act(() => result.current.startNewThread());
    expect(result.current.activeThread).toBeNull();

    act(() => result.current.selectThread(threadId));
    expect(result.current.activeThread?.id).toBe(threadId);

    act(() => result.current.deleteThread(threadId));
    expect(result.current.threads).toHaveLength(0);
    expect(result.current.activeThread).toBeNull();
  });

  it("persists threads to localStorage", () => {
    const { result } = renderHook(() => useAssistantChat(), { wrapper });

    act(() =>
      result.current.appendMessage({
        id: "u1",
        role: "user",
        content: "Persistido",
      }),
    );

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.threads[0].messages[0].content).toBe("Persistido");
  });

  it("rehydrates persisted threads", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "t1",
        threads: [
          {
            id: "t1",
            title: "Vieja",
            updatedAt: 1,
            messages: [{ id: "m1", role: "user", content: "Hola" }],
          },
        ],
      }),
    );

    const { result } = renderHook(() => useAssistantChat(), { wrapper });
    expect(result.current.activeThread?.title).toBe("Vieja");
    expect(result.current.activeThread?.messages[0].content).toBe("Hola");
  });
});

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { useAssistantChat } from "@/hooks/use-assistant-chat";

const STORAGE_KEY = "atlassfin.assistant.threads.v2";

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

  it("updates messages, conversation id and thread selection", () => {
    const { result } = renderHook(() => useAssistantChat(), { wrapper });

    act(() =>
      result.current.appendMessage({ id: "u1", role: "user", content: "Hola" }),
    );
    const threadId = result.current.activeThread!.id;

    act(() => result.current.setConversationId("conv-1"));
    expect(result.current.activeThread?.conversationId).toBe("conv-1");

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

  it("strips action tokens before persisting to localStorage", () => {
    const { result } = renderHook(() => useAssistantChat(), { wrapper });

    act(() =>
      result.current.appendMessage({
        id: "a1",
        role: "assistant",
        content: "",
        actions: [
          {
            actionId: "act-1",
            token: "secret-token",
            name: "create_transaction",
            title: "Crear",
            classification: "write_safe",
            destructive: false,
            summary: "",
            preview: { title: "Crear", summary: "", fields: [] },
            expiresAt: "",
            planId: null,
            step: 0,
            pending: true,
            status: "proposed",
          },
        ],
      }),
    );

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.threads[0].messages[0].actions[0].token).toBe("");
  });

  it("marks pending actions without a token as failed on rehydrate", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "t1",
        threads: [
          {
            id: "t1",
            title: "Vieja",
            conversationId: null,
            updatedAt: 1,
            messages: [
              {
                id: "m1",
                role: "assistant",
                content: "",
                actions: [
                  {
                    actionId: "act-1",
                    token: "",
                    name: "create_transaction",
                    title: "Crear",
                    classification: "write_safe",
                    destructive: false,
                    summary: "",
                    preview: { title: "Crear", summary: "", fields: [] },
                    expiresAt: "",
                    planId: null,
                    step: 0,
                    pending: true,
                    status: "proposed",
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    const { result } = renderHook(() => useAssistantChat(), { wrapper });
    const action = result.current.activeThread?.messages[0].actions?.[0];
    expect(action?.status).toBe("failed");
    expect(action?.resultSummary).toMatch(/seguridad/);
  });
});

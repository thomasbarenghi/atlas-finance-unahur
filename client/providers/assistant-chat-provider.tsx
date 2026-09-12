"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AssistantChatContext,
  type AssistantChatMessage,
  type AssistantThread,
} from "@/hooks/use-assistant-chat";
import { readJson, writeJson } from "@/lib/storage";

const STORAGE_KEY = "atlassfin.assistant.threads.v1";

interface AssistantChatState {
  threads: AssistantThread[];
  activeId: string | null;
}

const titleFrom = (message: AssistantChatMessage): string =>
  message.role === "user" && message.content
    ? message.content.slice(0, 60)
    : "Nueva conversación";

const readState = (): AssistantChatState => {
  const parsed = readJson<Partial<AssistantChatState>>(STORAGE_KEY, {
    threads: [],
    activeId: null,
  });
  const threads = (Array.isArray(parsed.threads) ? parsed.threads : []).map(
    (thread) => ({
      ...thread,
      messages: (thread.messages ?? []).map((message) => ({
        ...message,
        audioUrl: undefined,
      })),
    }),
  ) as AssistantThread[];
  return {
    threads,
    activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
  };
};

export const AssistantChatProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<AssistantChatState>(readState);

  useEffect(() => {
    writeJson(STORAGE_KEY, state);
  }, [state]);

  const appendMessage = useCallback((message: AssistantChatMessage) => {
    setState((previous) => {
      const existing = previous.activeId
        ? previous.threads.find((thread) => thread.id === previous.activeId)
        : undefined;

      if (!existing) {
        const id = crypto.randomUUID();
        return {
          activeId: id,
          threads: [
            ...previous.threads,
            {
              id,
              title: titleFrom(message),
              conversationId: null,
              messages: [message],
              updatedAt: Date.now(),
            },
          ],
        };
      }

      return {
        ...previous,
        threads: previous.threads.map((thread) =>
          thread.id === existing.id
            ? {
                ...thread,
                title: thread.title || titleFrom(message),
                messages: [...thread.messages, message],
                updatedAt: Date.now(),
              }
            : thread,
        ),
      };
    });
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<AssistantChatMessage>) => {
      setState((previous) => ({
        ...previous,
        threads: previous.threads.map((thread) =>
          thread.id === previous.activeId
            ? {
                ...thread,
                messages: thread.messages.map((message) =>
                  message.id === id ? { ...message, ...patch } : message,
                ),
                updatedAt: Date.now(),
              }
            : thread,
        ),
      }));
    },
    [],
  );

  const setConversationId = useCallback((conversationId: string) => {
    setState((previous) => ({
      ...previous,
      threads: previous.threads.map((thread) =>
        thread.id === previous.activeId
          ? { ...thread, conversationId }
          : thread,
      ),
    }));
  }, []);

  const startNewThread = useCallback(() => {
    setState((previous) => ({ ...previous, activeId: null }));
  }, []);

  const selectThread = useCallback((id: string) => {
    setState((previous) => ({ ...previous, activeId: id }));
  }, []);

  const deleteThread = useCallback((id: string) => {
    setState((previous) => ({
      threads: previous.threads.filter((thread) => thread.id !== id),
      activeId: previous.activeId === id ? null : previous.activeId,
    }));
  }, []);

  const activeThread = useMemo(
    () =>
      state.activeId
        ? (state.threads.find((thread) => thread.id === state.activeId) ?? null)
        : null,
    [state],
  );

  const value = useMemo(
    () => ({
      threads: state.threads,
      activeThread,
      setConversationId,
      appendMessage,
      updateMessage,
      startNewThread,
      selectThread,
      deleteThread,
    }),
    [
      state.threads,
      activeThread,
      setConversationId,
      appendMessage,
      updateMessage,
      startNewThread,
      selectThread,
      deleteThread,
    ],
  );

  return (
    <AssistantChatContext.Provider value={value}>
      {children}
    </AssistantChatContext.Provider>
  );
};

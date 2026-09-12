"use client";

import { createContext, useContext } from "react";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

export interface AssistantThread {
  id: string;
  title: string;
  conversationId: string | null;
  messages: AssistantChatMessage[];
  updatedAt: number;
}

export interface AssistantChatContextValue {
  threads: AssistantThread[];
  activeThread: AssistantThread | null;
  setConversationId: (conversationId: string) => void;
  appendMessage: (message: AssistantChatMessage) => void;
  updateMessage: (id: string, patch: Partial<AssistantChatMessage>) => void;
  startNewThread: () => void;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
}

export const AssistantChatContext =
  createContext<AssistantChatContextValue | null>(null);

export const useAssistantChat = (): AssistantChatContextValue => {
  const context = useContext(AssistantChatContext);
  if (!context) {
    throw new Error(
      "useAssistantChat debe usarse dentro de AssistantChatProvider",
    );
  }
  return context;
};

"use client";

import { createContext, useContext } from "react";
import type {
  ActionClass,
  ActionPreview,
  AssistantActionEntity,
} from "@/lib/api/types";

export type AssistantActionStatus =
  "proposed" | "executing" | "executed" | "failed" | "cancelled";

export interface AssistantActionItem {
  actionId: string;
  token: string;
  name: string;
  title: string;
  classification: ActionClass;
  destructive: boolean;
  summary: string;
  preview: ActionPreview;
  expiresAt: string;
  planId: string | null;
  step: number;
  pending: boolean;
  status: AssistantActionStatus;
  resultSummary?: string;
  entity?: AssistantActionEntity | null;
}

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  actions?: AssistantActionItem[];
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

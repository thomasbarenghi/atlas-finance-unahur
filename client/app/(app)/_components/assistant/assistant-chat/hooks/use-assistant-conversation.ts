"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePeriod } from "@/hooks/use-period";
import { useReadingCurrency } from "@/hooks/use-reading-currency";
import { streamAssistantMessage } from "@/lib/api/assistant-stream";
import { getErrorMessage } from "@/lib/api/errors";
import type { AssistantHistoryMessage } from "@/lib/api/types";
import { buildAssistantHistory } from "./assistant-history";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const useAssistantConversation = () => {
  const { range } = usePeriod();
  const { currency } = useReadingCurrency();
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const appendMessage = useCallback((message: AssistantChatMessage) => {
    setMessages((previous) => [...previous, message]);
  }, []);

  const updateMessage = useCallback(
    (id: string, patch: Partial<AssistantChatMessage>) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === id ? { ...message, ...patch } : message,
        ),
      );
    },
    [],
  );

  // Abort the in-flight stream and stop updating state once unmounted (avoids
  // post-teardown updates that would touch a disposed environment). The flag is
  // reset on mount because StrictMode runs effects mount → cleanup → mount,
  // and leaving it `false` would discard every token and keep the chat stuck.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const streamInto = useCallback(
    async (
      assistantId: string,
      question: string,
      history: AssistantHistoryMessage[],
    ) => {
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let received = "";
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 30_000);
      try {
        await streamAssistantMessage(
          { question, period: range, currency, history },
          {
            onToken: (delta) => {
              if (!mountedRef.current) return;
              received += delta;
              updateMessage(assistantId, { content: received });
              requestAnimationFrame(scrollToBottom);
            },
            onError: (message) => {
              if (!mountedRef.current) return;
              updateMessage(assistantId, { content: message });
              toast.error(message);
            },
          },
          { signal: controller.signal },
        );
      } catch (error) {
        if (!mountedRef.current) return;
        if ((error as { name?: string })?.name === "AbortError") {
          updateMessage(assistantId, {
            content: timedOut
              ? "El asistente tardó demasiado en responder. Intentá de nuevo."
              : received
                ? `${received}\n\n(Respuesta detenida)`
                : "Respuesta detenida.",
          });
        } else {
          const message =
            error instanceof TypeError
              ? "El asistente no está disponible en este momento"
              : getErrorMessage(
                  error,
                  "El asistente no está disponible en este momento",
                );
          updateMessage(assistantId, { content: message });
          toast.error(message);
        }
      } finally {
        window.clearTimeout(timeout);
        abortRef.current = null;
        if (!mountedRef.current) return;
        setIsStreaming(false);
        requestAnimationFrame(scrollToBottom);
      }
    },
    [range, currency, updateMessage, scrollToBottom],
  );

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming) return;

      const history = buildAssistantHistory(messages);
      const assistantId = crypto.randomUUID();
      appendMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      });
      appendMessage({ id: assistantId, role: "assistant", content: "" });
      setInput("");
      await streamInto(assistantId, trimmed, history);
    },
    [isStreaming, messages, appendMessage, streamInto],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy: isStreaming,
    submit,
    cancelStream,
  };
};

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { usePeriod } from "@/hooks/use-period";
import { streamAssistantMessage } from "@/lib/api/assistant-stream";
import { getErrorMessage } from "@/lib/api/errors";

export const useAssistantConversation = () => {
  const { range } = usePeriod();
  const { activeThread, appendMessage, updateMessage, startNewThread } =
    useAssistantChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);
  const isBusy = isStreaming;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const streamInto = useCallback(
    async (assistantId: string, question: string) => {
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let received = "";
      try {
        await streamAssistantMessage(
          { question, period: range },
          {
            onToken: (delta) => {
              received += delta;
              updateMessage(assistantId, { content: received });
              requestAnimationFrame(scrollToBottom);
            },
            onError: (message) => {
              updateMessage(assistantId, { content: message });
              toast.error(message);
            },
          },
          { signal: controller.signal },
        );
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") {
          updateMessage(assistantId, {
            content: received
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
        abortRef.current = null;
        setIsStreaming(false);
        requestAnimationFrame(scrollToBottom);
      }
    },
    [range, updateMessage, scrollToBottom],
  );

  const submit = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isBusy) return;

      const assistantId = crypto.randomUUID();
      appendMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      });
      appendMessage({ id: assistantId, role: "assistant", content: "" });
      setInput("");
      await streamInto(assistantId, trimmed);
    },
    [isBusy, appendMessage, streamInto],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy,
    submit,
    cancelStream,
    startNewThread,
  };
};

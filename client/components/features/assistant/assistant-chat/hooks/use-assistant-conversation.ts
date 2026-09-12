"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { streamAssistantMessage } from "@/lib/api/assistant-stream";
import type { AssistantAction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/errors";

const NO_TRANSCRIPT_MESSAGE =
  "Recibí tu audio, pero no pude transcribirlo en este dispositivo. Escribí tu pregunta o probá con dictado por voz disponible.";

export const useAssistantConversation = () => {
  const { user } = useAuth();
  const { range } = usePeriod();
  const recorder = useAudioRecorder();
  const speech = useSpeechRecognition();
  const {
    activeThread,
    setConversationId,
    appendMessage,
    updateMessage,
    startNewThread,
  } = useAssistantChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioUrlsRef = useRef<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messages = activeThread?.messages ?? [];
  const conversationId = activeThread?.conversationId ?? null;
  const isBusy = isStreaming;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const failAssistant = useCallback(
    (assistantId: string, error: unknown) => {
      const message = getErrorMessage(
        error,
        "El asistente no está disponible en este momento",
      );
      updateMessage(assistantId, { content: message });
      toast.error(message);
    },
    [updateMessage],
  );

  const streamInto = useCallback(
    async (assistantId: string, question: string) => {
      setIsStreaming(true);
      let received = "";
      const actions: AssistantAction[] = [];
      try {
        await streamAssistantMessage(
          {
            question,
            conversationId,
            period: range,
            currency: user?.baseCurrency,
          },
          {
            onMeta: (meta) => setConversationId(meta.conversationId),
            onToken: (delta) => {
              received += delta;
              updateMessage(assistantId, { content: received });
              requestAnimationFrame(scrollToBottom);
            },
            onAction: (action) => {
              actions.push(action);
              updateMessage(assistantId, { actions: [...actions] });
              requestAnimationFrame(scrollToBottom);
            },
            onError: (message) => {
              updateMessage(assistantId, { content: message });
              toast.error(message);
            },
          },
        );
      } catch (error) {
        failAssistant(assistantId, error);
      } finally {
        setIsStreaming(false);
        requestAnimationFrame(scrollToBottom);
      }
    },
    [
      conversationId,
      range,
      user,
      setConversationId,
      updateMessage,
      scrollToBottom,
      failAssistant,
    ],
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

  const startRecording = useCallback(async () => {
    const recorded = await recorder.start();
    if (recorded) await speech.start();
  }, [recorder, speech]);

  const cancelRecording = useCallback(() => {
    void speech.cancel();
    recorder.cancel();
  }, [recorder, speech]);

  const stopRecording = useCallback(async () => {
    const transcript = await speech.stop();
    const recorded = await recorder.stop();
    if (!recorded) return;

    const assistantId = crypto.randomUUID();
    audioUrlsRef.current.add(recorded.url);
    appendMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: transcript,
      audioUrl: recorded.url,
    });
    appendMessage({ id: assistantId, role: "assistant", content: "" });

    if (!transcript.trim()) {
      updateMessage(assistantId, { content: NO_TRANSCRIPT_MESSAGE });
      requestAnimationFrame(scrollToBottom);
      return;
    }

    await streamInto(assistantId, transcript);
  }, [
    speech,
    recorder,
    appendMessage,
    updateMessage,
    scrollToBottom,
    streamInto,
  ]);

  return {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy,
    submit,
    recorder,
    canUseAudio: !speech.isNative,
    startRecording,
    cancelRecording,
    stopRecording,
    startNewThread,
  };
};

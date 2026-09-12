"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { streamAssistantMessage } from "@/lib/api/assistant-stream";
import { getErrorMessage } from "@/lib/api/errors";
import { useSendAssistantAudio } from "@/lib/query/assistant";

export const useAssistantConversation = () => {
  const { user } = useAuth();
  const { range } = usePeriod();
  const sendAudio = useSendAssistantAudio();
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
  const isBusy = isStreaming || sendAudio.isPending;

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
      setIsStreaming(true);

      let received = "";
      try {
        await streamAssistantMessage(
          {
            question: trimmed,
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
      isBusy,
      appendMessage,
      conversationId,
      range,
      user,
      setConversationId,
      updateMessage,
      scrollToBottom,
      failAssistant,
    ],
  );

  const startRecording = useCallback(async () => {
    const started = await recorder.start();
    if (started) speech.start();
  }, [recorder, speech]);

  const cancelRecording = useCallback(() => {
    speech.cancel();
    recorder.cancel();
  }, [recorder, speech]);

  const stopRecording = useCallback(async () => {
    const transcript = speech.stop();
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

    try {
      const reply = await sendAudio.mutateAsync({
        durationMs: recorded.durationMs,
        transcript: transcript || undefined,
        blob: recorded.blob,
        conversationId,
        period: range,
        currency: user?.baseCurrency,
      });
      setConversationId(reply.conversationId);
      updateMessage(assistantId, { content: reply.answer });
    } catch (error) {
      failAssistant(assistantId, error);
    } finally {
      requestAnimationFrame(scrollToBottom);
    }
  }, [
    speech,
    recorder,
    appendMessage,
    sendAudio,
    conversationId,
    range,
    user,
    setConversationId,
    updateMessage,
    failAssistant,
    scrollToBottom,
  ]);

  return {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy,
    submit,
    recorder,
    startRecording,
    cancelRecording,
    stopRecording,
    startNewThread,
  };
};

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type AssistantActionItem,
  useAssistantChat,
} from "@/hooks/use-assistant-chat";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAuth } from "@/hooks/use-auth";
import { usePeriod } from "@/hooks/use-period";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { assistantEndpoints } from "@/lib/api/endpoints";
import { streamAssistantMessage } from "@/lib/api/assistant-stream";
import type {
  AssistantActionError,
  AssistantActionProposal,
  AssistantActionResult,
} from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query/keys";

const NO_TRANSCRIPT_MESSAGE =
  "Recibí tu audio, pero no pude transcribirlo en este dispositivo. Escribí tu pregunta o probá con dictado por voz disponible.";

const toActionItem = (
  proposal: AssistantActionProposal,
): AssistantActionItem => ({
  actionId: proposal.actionId,
  token: proposal.token,
  name: proposal.name,
  title: proposal.title,
  classification: proposal.classification,
  destructive: proposal.destructive,
  summary: proposal.summary,
  preview: proposal.preview,
  expiresAt: proposal.expiresAt,
  planId: proposal.planId,
  step: proposal.step,
  pending: proposal.pending,
  status: "proposed",
});

const toErrorItem = (error: AssistantActionError): AssistantActionItem => ({
  actionId: crypto.randomUUID(),
  token: "",
  name: error.name,
  title: error.title,
  classification: "write_safe",
  destructive: false,
  summary: error.message,
  preview: { title: error.title, summary: error.message, fields: [] },
  expiresAt: "",
  planId: null,
  step: 0,
  pending: false,
  status: "failed",
  resultSummary: error.message,
});

export const useAssistantConversation = () => {
  const { user } = useAuth();
  const { range } = usePeriod();
  const recorder = useAudioRecorder();
  const speech = useSpeechRecognition();
  const queryClient = useQueryClient();
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

  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);
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
      const actions: AssistantActionItem[] = [];
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
            onProposal: (proposal) => {
              actions.push(toActionItem(proposal));
              updateMessage(assistantId, { actions: [...actions] });
              requestAnimationFrame(scrollToBottom);
            },
            onActionError: (error) => {
              actions.push(toErrorItem(error));
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

  const invalidateForAction = useCallback(() => {
    const keys: readonly (readonly unknown[])[] = [
      queryKeys.dashboardBase,
      queryKeys.transactionsBase,
      queryKeys.accounts,
      queryKeys.categories,
      queryKeys.budgetsBase,
      queryKeys.assets,
      queryKeys.debts,
      queryKeys.positions,
      queryKeys.goals,
    ];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  const resolveAction = useCallback(
    async (
      assistantId: string,
      actionId: string,
      mode: "confirm" | "cancel",
    ) => {
      const message = messages.find((item) =>
        item.actions?.some((action) => action.actionId === actionId),
      );
      const action = message?.actions?.find(
        (item) => item.actionId === actionId,
      );
      if (!message || !action) return;

      const patch = (
        status: AssistantActionItem["status"],
        resultSummary?: string,
      ) =>
        updateMessage(message.id, {
          actions: message.actions?.map((item) =>
            item.actionId === actionId
              ? {
                  ...item,
                  status,
                  resultSummary: resultSummary ?? item.resultSummary,
                }
              : item,
          ),
        });

      patch("executing");
      try {
        const result: AssistantActionResult =
          mode === "confirm"
            ? await assistantEndpoints.confirmAction(actionId, action.token)
            : await assistantEndpoints.cancelAction(actionId, action.token);
        patch(result.status, result.summary);
        if (result.status === "executed") {
          toast.success(result.summary);
          invalidateForAction();
        }
      } catch (error) {
        const messageText = getErrorMessage(
          error,
          "No se pudo completar la acción",
        );
        patch("failed", messageText);
        toast.error(messageText);
      }
    },
    [messages, updateMessage, invalidateForAction],
  );

  const confirmAction = useCallback(
    (assistantId: string, actionId: string) =>
      resolveAction(assistantId, actionId, "confirm"),
    [resolveAction],
  );

  const cancelAction = useCallback(
    (assistantId: string, actionId: string) =>
      resolveAction(assistantId, actionId, "cancel"),
    [resolveAction],
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

  const isActionLocked = useCallback(
    (action: AssistantActionItem) => {
      if (!action.planId) return false;
      return messages.some(
        (message) =>
          message.actions?.some(
            (other) =>
              other.planId === action.planId &&
              other.step < action.step &&
              other.status !== "executed" &&
              other.status !== "cancelled" &&
              other.status !== "failed",
          ) ?? false,
      );
    },
    [messages],
  );

  return {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy,
    submit,
    confirmAction,
    cancelAction,
    isActionLocked,
    recorder,
    canUseAudio: !speech.isNative,
    startRecording,
    cancelRecording,
    stopRecording,
    startNewThread,
  };
};

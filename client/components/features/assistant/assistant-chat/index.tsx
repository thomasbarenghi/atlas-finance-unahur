"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  History,
  Info,
  Loader2,
  MessageCircleQuestion,
  Mic,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { MarkdownText } from "@/components/common/markdown-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAssistantChat } from "@/hooks/use-assistant-chat";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { AssistantActionCard } from "../assistant-action-card";
import { AssistantHistorySheet } from "./history-sheet";
import { useAssistantConversation } from "./hooks/use-assistant-conversation";

const SUGGESTED_QUESTIONS = [
  "¿En qué gasté más este mes?",
  "¿Cómo van mis presupuestos?",
  "Creá una cuenta de banco en pesos",
];

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export interface AssistantChatProps {
  onClose?: () => void;
  showHeader?: boolean;
  historyOpen?: boolean;
  onHistoryOpenChange?: (open: boolean) => void;
}

export const AssistantChat = ({
  onClose,
  showHeader = true,
  historyOpen: historyOpenProp,
  onHistoryOpenChange,
}: AssistantChatProps) => {
  const { user } = useAuth();
  const { threads, activeThread, selectThread, deleteThread } =
    useAssistantChat();
  const {
    bottomRef,
    messages,
    input,
    setInput,
    isBusy,
    submit,
    recorder,
    canUseAudio,
    startRecording,
    cancelRecording,
    stopRecording,
    startNewThread,
  } = useAssistantConversation();

  const [internalHistoryOpen, setInternalHistoryOpen] = useState(false);
  const historyOpen = historyOpenProp ?? internalHistoryOpen;
  const setHistoryOpen = onHistoryOpenChange ?? setInternalHistoryOpen;

  if (user && !user.aiEnabled) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        {showHeader ? (
          <ScopeHeader onClose={onClose} onNewChat={startNewThread} />
        ) : null}
        <Alert>
          <Info />
          <AlertTitle>Asistente deshabilitado</AlertTitle>
          <AlertDescription>
            Habilitá el asistente de IA en Ajustes para hacerle preguntas sobre
            tus datos.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-fit">
          <Link href="/settings">Ir a Ajustes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {showHeader ? (
        <div className="border-b p-4">
          <ScopeHeader
            onClose={onClose}
            onNewChat={startNewThread}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <span className="from-primary/25 to-primary/5 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br">
                <Sparkles className="text-primary size-7" aria-hidden />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-semibold">
                  ¿En qué te ayudo?
                </h2>
                <p className="text-muted-foreground max-w-xs text-sm">
                  Preguntá por tus gastos, presupuestos o patrimonio. También
                  podés pedirle que cree o edite cuentas.
                </p>
              </div>
              <div className="flex w-full max-w-sm flex-col gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() => submit(question)}
                    className="bg-card hover:bg-muted/50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors"
                  >
                    <MessageCircleQuestion
                      className="text-primary size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="flex-1">{question}</span>
                    <ArrowUpRight
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-[85%] flex-col gap-1 rounded-2xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted",
                )}
              >
                {message.audioUrl ? (
                  <audio
                    controls
                    src={message.audioUrl}
                    className="h-9 w-56 max-w-full"
                  />
                ) : null}
                {message.role === "assistant" && message.actions?.length ? (
                  <div className="flex flex-col gap-1.5">
                    {message.actions.map((action, index) => (
                      <AssistantActionCard
                        key={`${action.name}-${index}`}
                        action={action}
                      />
                    ))}
                  </div>
                ) : null}
                {message.content ? (
                  message.role === "assistant" ? (
                    <MarkdownText content={message.content} />
                  ) : (
                    <span>{message.content}</span>
                  )
                ) : message.role === "assistant" && !message.actions?.length ? (
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    Pensando…
                  </span>
                ) : null}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
        {recorder.error ? (
          <p className="text-destructive text-xs">{recorder.error}</p>
        ) : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(input);
          }}
        >
          {recorder.isRecording ? (
            <>
              <div className="flex h-9 flex-1 items-center gap-2 rounded-4xl border px-3">
                <span className="bg-destructive size-2.5 animate-pulse rounded-full" />
                <span className="text-sm tabular-nums">
                  {formatDuration(recorder.elapsedMs)}
                </span>
                <span className="text-muted-foreground text-xs">Grabando…</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Cancelar grabación"
                onClick={cancelRecording}
              >
                <Trash2 />
              </Button>
              <Button
                type="button"
                size="icon"
                aria-label="Enviar audio"
                onClick={stopRecording}
              >
                <Square />
              </Button>
            </>
          ) : (
            <>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit(input);
                  }
                }}
                placeholder="Escribí tu pregunta…"
                rows={1}
                className="max-h-32 min-h-9 resize-none"
                aria-label="Pregunta para el asistente"
              />
              {canUseAudio ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Grabar audio"
                  disabled={isBusy}
                  onClick={startRecording}
                >
                  <Mic />
                </Button>
              ) : null}
              <Button
                type="submit"
                size="icon"
                aria-label="Enviar pregunta"
                disabled={isBusy || !input.trim()}
              >
                <Send />
              </Button>
            </>
          )}
        </form>
      </div>

      <AssistantHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        threads={threads}
        activeId={activeThread?.id ?? null}
        onSelect={selectThread}
        onDelete={deleteThread}
        onNew={startNewThread}
      />
    </div>
  );
};

const ScopeHeader = ({
  onClose,
  onNewChat,
  onOpenHistory,
}: {
  onClose?: () => void;
  onNewChat: () => void;
  onOpenHistory?: () => void;
}) => {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="from-primary/25 to-primary/5 flex size-8 items-center justify-center rounded-full bg-gradient-to-br">
          <Sparkles className="text-primary size-4" aria-hidden />
        </span>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-semibold">Asistente</span>
          <span className="text-muted-foreground text-xs">
            Información de tus datos, no asesoramiento financiero.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Nueva conversación"
          onClick={onNewChat}
        >
          <Plus />
        </Button>
        {onOpenHistory ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Historial"
            onClick={onOpenHistory}
          >
            <History />
          </Button>
        ) : null}
        {onClose ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar asistente"
            onClick={onClose}
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

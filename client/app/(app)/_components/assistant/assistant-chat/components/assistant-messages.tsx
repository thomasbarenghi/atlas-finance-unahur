"use client";

import { Loader2, Sparkles } from "lucide-react";
import { MarkdownText } from "./markdown-text";
import type { AssistantChatMessage } from "../hooks/use-assistant-conversation";

export interface AssistantMessagesProps {
  messages: AssistantChatMessage[];
  isBusy: boolean;
}

export const AssistantMessages = ({
  messages,
  isBusy,
}: AssistantMessagesProps) => {
  return (
    <>
      {messages.map((message) =>
        message.role === "user" ? (
          <div
            key={message.id}
            className="bg-[#E9EFE6] text-ink2 ml-auto max-w-[85%] rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[12.5px]"
          >
            {message.content}
          </div>
        ) : (
          <div key={message.id} className="flex items-start gap-2.5">
            <span className="bg-accent flex size-7 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="text-primary size-3.5" aria-hidden />
            </span>
            <div className="bg-card border-line min-w-0 flex-1 rounded-2xl border px-4 py-3 text-[12.5px]">
              {message.content ? (
                <MarkdownText content={message.content} />
              ) : isBusy ? (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Pensando…
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Respuesta interrumpida.
                </span>
              )}
            </div>
          </div>
        ),
      )}
    </>
  );
};

import { mockApi } from "@/lib/mocks/api";
import { API_BASE_URL, refreshAuthSession } from "./client";
import type {
  AssistantAction,
  AssistantMessageInput,
  PeriodRange,
} from "./types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const ASSISTANT_LIVE = process.env.NEXT_PUBLIC_ASSISTANT_LIVE === "true";

export interface AssistantStreamMeta {
  conversationId: string;
  period?: PeriodRange;
  currency?: string;
  sources?: string[];
}

export interface AssistantStreamHandlers {
  onMeta?: (meta: AssistantStreamMeta) => void;
  onToken?: (delta: string) => void;
  onAction?: (action: AssistantAction) => void;
  onDone?: (result: { conversationId: string; insufficient: boolean }) => void;
  onError?: (message: string) => void;
}

const parseFrame = (frame: string): { event: string; data: string } => {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  return { event, data };
};

export const streamAssistantMessage = async (
  input: AssistantMessageInput,
  handlers: AssistantStreamHandlers,
): Promise<void> => {
  if (USE_MOCKS && !ASSISTANT_LIVE) {
    const reply = await mockApi.sendMessage(input);
    handlers.onMeta?.({
      conversationId: reply.conversationId,
      period: input.period,
      currency: input.currency,
      sources: reply.contextMeta.sources,
    });
    const words = reply.answer.split(" ");
    for (let index = 0; index < words.length; index += 1) {
      handlers.onToken?.(
        `${words[index]}${index < words.length - 1 ? " " : ""}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
    handlers.onDone?.({
      conversationId: reply.conversationId,
      insufficient: reply.insufficient,
    });
    return;
  }

  const send = () =>
    fetch(`${API_BASE_URL}/assistant/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: input.question,
        conversationId: input.conversationId ?? null,
        period: input.period,
        currency: input.currency,
      }),
    });

  let response = await send();
  if (response.status === 401) {
    const refreshed = await refreshAuthSession();
    if (refreshed) response = await send();
  }

  if (!response.ok || !response.body) {
    let message = "El asistente no está disponible";
    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message ?? message;
    } catch {
      // Keep the generic message.
    }
    handlers.onError?.(message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const chunk = await reader.read();
    buffer += decoder.decode(chunk.value ?? new Uint8Array(), {
      stream: !chunk.done,
    });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const { event, data } = parseFrame(frame);
      if (!data) continue;
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (event === "meta") {
        handlers.onMeta?.(parsed as unknown as AssistantStreamMeta);
      } else if (event === "token") {
        handlers.onToken?.(String(parsed.delta ?? ""));
      } else if (event === "action") {
        handlers.onAction?.(parsed as unknown as AssistantAction);
      } else if (event === "done") {
        handlers.onDone?.({
          conversationId: String(parsed.conversationId ?? ""),
          insufficient: Boolean(parsed.insufficient),
        });
      } else if (event === "error") {
        handlers.onError?.(
          String(parsed.message ?? "El asistente no está disponible"),
        );
      }
    }

    if (chunk.done) break;
  }
};

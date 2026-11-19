import { API_BASE_URL, refreshAuthSession } from "./client";
import type { AssistantMessageInput, PeriodRange } from "./types";

export interface AssistantStreamMeta {
  period?: PeriodRange;
  currency?: string;
  sources?: string[];
  disclaimer?: string;
}

export interface AssistantStreamHandlers {
  onMeta?: (meta: AssistantStreamMeta) => void;
  onToken?: (delta: string) => void;
  onDone?: (result: { insufficient: boolean }) => void;
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
  options?: { signal?: AbortSignal },
): Promise<void> => {
  const send = async () => {
    return fetch(`${API_BASE_URL}/assistant/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: options?.signal,
      body: JSON.stringify({
        question: input.question,
        period: input.period,
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.history?.length ? { history: input.history } : {}),
      }),
    });
  };

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
      } else if (event === "done") {
        handlers.onDone?.({ insufficient: Boolean(parsed.insufficient) });
      } else if (event === "error") {
        handlers.onError?.(
          String(parsed.message ?? "El asistente no está disponible"),
        );
      }
    }

    if (chunk.done) break;
  }
};

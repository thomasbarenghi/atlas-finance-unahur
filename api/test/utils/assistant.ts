import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { httpClient } from "./test-app";
import type { AiStreamChunk } from "../../src/shared/ai/ai.service";
import { bearer } from "./auth";

export const enableAssistant = async (
  app: INestApplication,
  token: string,
): Promise<void> => {
  await request(httpClient(app))
    .patch("/api/users/me")
    .set(bearer(token))
    .send({ aiEnabled: true })
    .expect(200);
};

export interface SseEvent {
  event: string;
  data: any;
}

export const parseSse = (text: string): SseEvent[] => {
  const events: SseEvent[] = [];
  const regex = /event: ([^\n]+)\ndata: ([^\n]+)\n\n/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    events.push({ event: match[1], data: JSON.parse(match[2]) });
  }
  return events;
};

/**
 * AiService stub that plays the provided chunk sequences (one per streamChat
 * call). Calls beyond the provided sequences yield an empty stream.
 */
export const aiStub = (
  sequences: AiStreamChunk[][],
): { streamChat: () => AsyncGenerator<AiStreamChunk> } => {
  let call = 0;
  return {
    streamChat: async function* (): AsyncGenerator<AiStreamChunk> {
      const chunks = sequences[call] ?? [];
      call += 1;
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
};

export const postAssistantMessage = (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
) =>
  request(httpClient(app))
    .post("/api/assistant/messages")
    .set(bearer(token))
    .send({ question: "¿En qué gasté este mes?", ...body });

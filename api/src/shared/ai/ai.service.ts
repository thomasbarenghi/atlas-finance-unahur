import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { AppConfig } from "../../config/configuration";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AiStreamChunk = { type: "token"; delta: string };

interface ChatCompletionChunk {
  choices?: { delta?: { content?: string | null } }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async *streamChat(messages: AiMessage[]): AsyncGenerator<AiStreamChunk> {
    const ai = this.config.get("ai", { infer: true });
    if (!ai.apiKey) {
      throw new ApiException(
        ErrorCode.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        "El asistente no está configurado",
      );
    }

    const controller = new AbortController();

    try {
      const response = await axios.post(
        `${ai.baseUrl}/chat/completions`,
        {
          model: ai.model,
          messages,
          stream: true,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${ai.apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "stream",
          signal: controller.signal,
          timeout: ai.timeoutMs,
          maxRedirects: 0,
        },
      );

      const stream = response.data as AsyncIterable<Buffer>;
      let buffer = "";
      let finished = false;

      for await (const chunk of stream) {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") {
            finished = true;
            break;
          }

          try {
            const parsed = JSON.parse(payload) as ChatCompletionChunk;
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: "token", delta: content };
            }
          } catch {
            // Ignore keep-alive or partial frames.
          }
        }

        if (finished) break;
      }
    } catch (error) {
      if (error instanceof ApiException) throw error;
      const detail = axios.isAxiosError(error)
        ? `status=${error.response?.status ?? "none"} message=${error.message}`
        : error instanceof Error
          ? error.message
          : "unknown error";
      this.logger.error(`AI provider request failed: ${detail}`);
      throw new ApiException(
        ErrorCode.AI_UNAVAILABLE,
        HttpStatus.BAD_GATEWAY,
        "El asistente no está disponible",
      );
    } finally {
      controller.abort();
    }
  }
}

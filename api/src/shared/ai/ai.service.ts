import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { AppConfig } from "../../config/configuration";

export interface AiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AiTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: AiToolCall[];
  tool_call_id?: string;
}

export interface AiChatOptions {
  tools?: AiTool[];
}

export type AiStreamChunk =
  | { type: "token"; delta: string }
  | { type: "tool_calls"; toolCalls: AiToolCall[] };

interface ChatCompletionDelta {
  content?: string | null;
  tool_calls?: {
    index?: number;
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }[];
}

interface ChatCompletionChunk {
  choices?: { delta?: ChatCompletionDelta }[];
}

interface PendingToolCall {
  id: string;
  name: string;
  args: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async *streamChat(
    messages: AiMessage[],
    options: AiChatOptions = {},
  ): AsyncGenerator<AiStreamChunk> {
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
      const body: Record<string, unknown> = {
        model: ai.model,
        messages,
        stream: true,
        temperature: 0.3,
      };
      if (options.tools && options.tools.length > 0) {
        body.tools = options.tools;
        body.tool_choice = "auto";
      }

      const response = await axios.post(
        `${ai.baseUrl}/chat/completions`,
        body,
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
      const toolCalls = new Map<number, PendingToolCall>();
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
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              yield { type: "token", delta: delta.content };
            }

            if (delta.tool_calls) {
              for (const call of delta.tool_calls) {
                const index = call.index ?? 0;
                const current = toolCalls.get(index) ?? {
                  id: "",
                  name: "",
                  args: "",
                };
                if (call.id) current.id = call.id;
                if (call.function?.name) current.name = call.function.name;
                if (call.function?.arguments) {
                  current.args += call.function.arguments;
                }
                toolCalls.set(index, current);
              }
            }
          } catch {
            // Ignore keep-alive or partial frames.
          }
        }

        if (finished) break;
      }

      if (toolCalls.size > 0) {
        const ordered = [...toolCalls.entries()]
          .sort(([a], [b]) => a - b)
          .map(([index, call]) => ({
            id: call.id || `call_${index}`,
            type: "function" as const,
            function: {
              name: call.name,
              arguments: call.args || "{}",
            },
          }));
        yield { type: "tool_calls", toolCalls: ordered };
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

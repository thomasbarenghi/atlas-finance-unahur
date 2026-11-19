import type { AssistantChatMessage } from "./use-assistant-conversation";
import type { AssistantHistoryMessage } from "@/lib/api/types";

export const MAX_HISTORY_MESSAGES = 10;
export const MAX_HISTORY_MESSAGE_LENGTH = 4000;

/**
 * Builds the recent turns sent alongside the current question so the assistant
 * can resolve follow-ups ("¿y lo del auto?"). It only includes completed turns
 * (skips the empty assistant placeholder) and caps count and length to keep the
 * request bounded. The conversation itself stays in the client's memory.
 */
export const buildAssistantHistory = (
  messages: AssistantChatMessage[],
): AssistantHistoryMessage[] =>
  messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({
      role,
      content: content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));

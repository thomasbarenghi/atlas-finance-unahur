import type { StoredConversationMessage } from "./entities/ai-conversation.entity";

export const MAX_HISTORY_MESSAGES = 12;
export const MAX_STORED_MESSAGES = 40;
export const MAX_HISTORY_CHARS = 4000;

export const toHistoryMessages = (
  stored: StoredConversationMessage[],
): StoredConversationMessage[] => {
  const messages = stored
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_HISTORY_CHARS),
    }));

  while (messages.length > 0 && messages[0].role === "assistant") {
    messages.shift();
  }
  return messages;
};

export const appendTurn = (
  stored: StoredConversationMessage[],
  question: string,
  answer: string,
): StoredConversationMessage[] =>
  [
    ...stored,
    { role: "user" as const, content: question },
    { role: "assistant" as const, content: answer },
  ].slice(-MAX_STORED_MESSAGES);

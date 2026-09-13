import type { StoredConversationMessage } from "./entities/ai-conversation.entity";
import {
  appendTurn,
  MAX_HISTORY_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_STORED_MESSAGES,
  toHistoryMessages,
} from "./conversation-history";

const turn = (index: number): StoredConversationMessage[] => [
  { role: "user", content: `pregunta ${index}` },
  { role: "assistant", content: `respuesta ${index}` },
];

describe("conversation-history", () => {
  describe("toHistoryMessages", () => {
    it("filters out empty content and keeps role/content", () => {
      const messages = toHistoryMessages([
        { role: "user", content: "hola" },
        { role: "assistant", content: "  " },
        { role: "user", content: "¿Y el iPhone?" },
      ]);

      expect(messages).toEqual([
        { role: "user", content: "hola" },
        { role: "user", content: "¿Y el iPhone?" },
      ]);
    });

    it("drops a leading assistant message so the history starts with the user", () => {
      const messages = toHistoryMessages([
        { role: "assistant", content: "respuesta suelta" },
        { role: "user", content: "pregunta" },
      ]);

      expect(messages[0]).toEqual({ role: "user", content: "pregunta" });
    });

    it("bound the amount of history sent to the model", () => {
      const stored = Array.from({ length: 20 }, (_, index) => turn(index))
        .flat()
        .slice(0, MAX_HISTORY_MESSAGES + 5);

      const messages = toHistoryMessages(stored);

      expect(messages.length).toBeLessThanOrEqual(MAX_HISTORY_MESSAGES);
      expect(messages[0].role).toBe("user");
    });

    it("truncates long contents", () => {
      const long = "x".repeat(MAX_HISTORY_CHARS + 500);

      const [message] = toHistoryMessages([{ role: "user", content: long }]);

      expect(message.content.length).toBe(MAX_HISTORY_CHARS);
    });
  });

  describe("appendTurn", () => {
    it("appends the new question and answer", () => {
      const stored = appendTurn(
        [{ role: "user", content: "hola" }],
        "nueva",
        "respuesta",
      );

      expect(stored.slice(-2)).toEqual([
        { role: "user", content: "nueva" },
        { role: "assistant", content: "respuesta" },
      ]);
    });

    it("caps the stored transcript", () => {
      const stored = Array.from({ length: MAX_STORED_MESSAGES }, (_, index) =>
        turn(index),
      ).flat();

      const result = appendTurn(stored, "nueva", "respuesta");

      expect(result.length).toBe(MAX_STORED_MESSAGES);
      expect(result[result.length - 1]).toEqual({
        role: "assistant",
        content: "respuesta",
      });
    });
  });
});

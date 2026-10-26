import { describe, expect, it } from "vitest";
import type { AssistantChatMessage } from "../use-assistant-conversation";
import {
  buildAssistantHistory,
  MAX_HISTORY_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
} from "../assistant-history";

const message = (
  id: string,
  role: AssistantChatMessage["role"],
  content: string,
): AssistantChatMessage => ({ id, role, content });

describe("buildAssistantHistory", () => {
  it("keeps completed turns in order and skips empty placeholders", () => {
    expect(
      buildAssistantHistory([
        message("1", "user", "¿Cuál fue mi mayor gasto?"),
        message("2", "assistant", "Supermercado."),
        message("3", "user", "¿Y lo del auto?"),
        message("4", "assistant", ""),
      ]),
    ).toEqual([
      { role: "user", content: "¿Cuál fue mi mayor gasto?" },
      { role: "assistant", content: "Supermercado." },
      { role: "user", content: "¿Y lo del auto?" },
    ]);
  });

  it("keeps only the most recent turns", () => {
    const messages = Array.from({ length: MAX_HISTORY_MESSAGES + 4 }, (_, i) =>
      message(String(i), "user", `turno ${i}`),
    );

    const history = buildAssistantHistory(messages);

    expect(history).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(history[0].content).toBe("turno 4");
    expect(history.at(-1)?.content).toBe(`turno ${MAX_HISTORY_MESSAGES + 3}`);
  });

  it("caps each turn to the maximum accepted length", () => {
    const history = buildAssistantHistory([
      message("1", "user", "a".repeat(MAX_HISTORY_MESSAGE_LENGTH + 10)),
    ]);

    expect(history[0].content).toHaveLength(MAX_HISTORY_MESSAGE_LENGTH);
  });
});

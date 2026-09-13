import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import type { AppConfig } from "../config/configuration";
import type { AiService, AiStreamChunk } from "../shared/ai/ai.service";
import { User } from "../users/entities/user.entity";
import { PendingActionsService } from "./actions/pending-actions.service";
import { AssistantContextService } from "./assistant-context.service";
import { AssistantEvent, AssistantService } from "./assistant.service";
import { AiConversation } from "./entities/ai-conversation.entity";
import { ToolRegistry } from "./tools/tool-registry.service";
import type { ToolDefinition } from "./tools/tool.types";

const user = {
  id: "user-1",
  aiEnabled: true,
  assistantDestructiveEnabled: false,
} as User;

const preview = { title: "Acción", summary: "resumen", fields: [] };

const toolCall = (name: string, id = "call-1", args = "{}") => ({
  type: "tool_calls" as const,
  toolCalls: [
    {
      id,
      type: "function" as const,
      function: { name, arguments: args },
    },
  ],
});

interface Harness {
  service: AssistantService;
  propose: jest.Mock;
}

const buildHarness = (
  streamChat: () => AsyncGenerator<AiStreamChunk>,
  getDefinition: (name: string) => ToolDefinition | undefined,
): Harness => {
  const usersRepository = {
    findOneBy: jest.fn().mockResolvedValue(user),
  } as unknown as Repository<User>;

  const conversationsRepository = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
  } as unknown as Repository<AiConversation>;

  const contextService = {
    build: jest.fn().mockResolvedValue({
      period: { from: "2026-09-01", to: "2026-09-30" },
      currency: "ARS",
      sources: ["transactions"],
      summary: "resumen",
    }),
  } as unknown as AssistantContextService;

  const registry = {
    toAiTools: jest.fn().mockReturnValue([]),
    catalog: jest.fn().mockReturnValue("catálogo"),
    get: jest.fn(getDefinition),
  } as unknown as ToolRegistry;

  let counter = 0;
  const propose = jest.fn((input: { summary: string; prepared: unknown }) =>
    Promise.resolve({
      actionId: `action-${++counter}`,
      token: `token-${counter}`,
      name: "tool",
      title: "Acción",
      classification: "write_safe",
      destructive: false,
      summary: input.summary,
      preview,
      expiresAt: "2026-09-12T00:00:00.000Z",
      planId: "plan-1",
      step: counter - 1,
      pending: input.prepared === null,
    }),
  );
  const recordRead = jest.fn().mockResolvedValue(undefined);
  const pendingActions = {
    propose,
    recordRead,
  } as unknown as PendingActionsService;

  const config = {
    get: jest.fn().mockReturnValue({
      devUserEmail: "demo@atlassfin.app",
      actionTtlMs: 120000,
    }),
  } as unknown as ConfigService<AppConfig, true>;

  const aiService = {
    streamChat: jest.fn(streamChat),
  } as unknown as AiService;

  const service = new AssistantService(
    usersRepository,
    conversationsRepository,
    contextService,
    aiService,
    registry,
    pendingActions,
    config,
  );

  return { service, propose };
};

const collect = async (
  service: AssistantService,
): Promise<AssistantEvent[]> => {
  const events: AssistantEvent[] = [];
  for await (const event of service.answer("user-1", {
    question: "compré un iPhone",
  })) {
    events.push(event);
  }
  return events;
};

const writeDefinition = (
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition => ({
  name: "createTransaction",
  title: "Crear movimiento",
  description: "Crea un movimiento",
  classification: "write_safe",
  parameters: { type: "object", properties: {} },
  prepare: () =>
    Promise.resolve({
      args: { amount: 1 },
      summary: "Registrar gasto",
      preview,
    }),
  execute: () => Promise.resolve({ ok: true, summary: "ok" }),
  ...overrides,
});

const streamWithCalls = (
  calls: ReturnType<typeof toolCall>[],
  finalText = "Confirmá en la tarjeta.",
): (() => AsyncGenerator<AiStreamChunk>) => {
  let step = 0;
  return () => {
    const current = step++;
    return (async function* () {
      await Promise.resolve();
      if (current < calls.length) {
        yield calls[current];
      } else {
        yield { type: "token", delta: finalText };
      }
    })();
  };
};

describe("AssistantService.answer", () => {
  it("emits an action_proposal when the model calls a write tool", async () => {
    const { service, propose } = buildHarness(
      streamWithCalls([toolCall("createTransaction")]),
      () => writeDefinition(),
    );

    const events = await collect(service);

    expect(propose).toHaveBeenCalledTimes(1);
    const proposal = events.find((event) => event.type === "action_proposal");
    expect(proposal).toBeDefined();
    expect(events.at(-1)?.type).toBe("done");
  });

  it("does not propose anything when preparing the action fails", async () => {
    const definition = writeDefinition({
      prepare: () => Promise.reject(new Error("boom")),
    });
    const { service, propose } = buildHarness(
      streamWithCalls([toolCall("createTransaction")]),
      () => definition,
    );

    const events = await collect(service);

    expect(propose).not.toHaveBeenCalled();
    expect(events.some((event) => event.type === "action_proposal")).toBe(
      false,
    );
    const error = events.find((event) => event.type === "action_error");
    expect(error).toBeDefined();
    if (error?.type === "action_error") {
      expect(error.data.code).toBe(ErrorCode.INTERNAL_ERROR);
    }
  });

  it("reports an unresolved reference as an error when nothing will create it", async () => {
    const definition = writeDefinition({
      prepare: () =>
        Promise.reject(
          new ApiException(
            ErrorCode.REFERENCE_PENDING,
            HttpStatus.CONFLICT,
            'No encontré ninguna categoría que coincida con "Comida".',
          ),
        ),
    });
    const { service, propose } = buildHarness(
      streamWithCalls([toolCall("createTransaction")]),
      () => definition,
    );

    const events = await collect(service);

    expect(propose).not.toHaveBeenCalled();
    const error = events.find((event) => event.type === "action_error");
    expect(error).toBeDefined();
    if (error?.type === "action_error") {
      expect(error.data.code).toBe(ErrorCode.NOT_FOUND);
    }
  });

  it("proposes a pending action when the reference names an entity created earlier in the plan", async () => {
    const createAsset = writeDefinition({
      name: "createAsset",
      title: "Crear activo",
      prepare: () =>
        Promise.resolve({
          args: { name: "Ford Ranger" },
          summary: "Crear activo",
          preview,
          createdEntityName: "Ford Ranger",
        }),
    });
    const createDebt = writeDefinition({
      name: "createDebt",
      title: "Crear deuda",
      prepare: () =>
        Promise.reject(
          new ApiException(
            ErrorCode.REFERENCE_PENDING,
            HttpStatus.CONFLICT,
            'No encontré ningún activo que coincida con "Ford Ranger".',
          ),
        ),
    });
    const { service, propose } = buildHarness(
      streamWithCalls([
        toolCall("createAsset", "call-1"),
        toolCall("createDebt", "call-2", '{"asset":"Ford Ranger"}'),
      ]),
      (name) => (name === "createAsset" ? createAsset : createDebt),
    );

    const events = await collect(service);

    expect(propose).toHaveBeenCalledTimes(2);
    expect(propose).toHaveBeenCalledWith(
      expect.objectContaining({ prepared: null }),
    );
    const proposals = events.filter(
      (event) => event.type === "action_proposal",
    );
    expect(proposals).toHaveLength(2);
    expect(
      proposals.some((event) =>
        event.type === "action_proposal" ? event.data.pending : false,
      ),
    ).toBe(true);
  });

  it("deduplicates identical write proposals within the same plan", async () => {
    const { service, propose } = buildHarness(
      streamWithCalls([
        toolCall("createTransaction", "call-1"),
        toolCall("createTransaction", "call-2"),
      ]),
      () => writeDefinition(),
    );

    const events = await collect(service);

    // La segunda llamada idéntica no crea otra acción ni otra tarjeta.
    expect(propose).toHaveBeenCalledTimes(1);
    expect(
      events.filter((event) => event.type === "action_proposal"),
    ).toHaveLength(1);
  });
});

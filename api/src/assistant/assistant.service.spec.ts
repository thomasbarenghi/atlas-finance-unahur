import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import type { AppConfig } from "../config/configuration";
import type { AiService, AiStreamChunk } from "../shared/ai/ai.service";
import type { UserResponseDto } from "../users/dto/user-response.dto";
import { UsersService } from "../users/users.service";
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
} as UserResponseDto;

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
  usersService: any;
  conversationsRepository: any;
  registry: any;
  pendingActions: any;
  recordRead: jest.Mock;
  config: any;
}

const buildHarness = (
  streamChat: () => AsyncGenerator<AiStreamChunk>,
  getDefinition: (name: string) => ToolDefinition | undefined,
): Harness => {
  const usersService = {
    getById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn().mockResolvedValue(user),
  } as unknown as UsersService;

  const conversationsRepository = {
    findOneBy: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
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
    executeRead: jest
      .fn()
      .mockResolvedValue({ ok: true, summary: "3 cuentas", data: {} }),
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
    conversationsRepository,
    usersService,
    contextService,
    aiService,
    registry,
    pendingActions,
    config,
  );

  return {
    service,
    propose,
    usersService,
    conversationsRepository,
    registry,
    pendingActions,
    recordRead,
    config,
  };
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

  it("deduplicates proposals whose args contain arrays", async () => {
    const withArray = writeDefinition({
      prepare: () =>
        Promise.resolve({
          args: { items: [1, 2] },
          summary: "s",
          preview,
        }),
    });
    const { service, propose } = buildHarness(
      streamWithCalls([
        toolCall("createTransaction", "call-1"),
        toolCall("createTransaction", "call-2"),
      ]),
      () => withArray,
    );
    await collect(service);
    expect(propose).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate identical deferred proposals", async () => {
    const createAsset = writeDefinition({
      name: "createAsset",
      prepare: () =>
        Promise.resolve({
          args: { name: "Ford" },
          summary: "s",
          preview,
          createdEntityName: "Ford",
        }),
    });
    const createDebt = writeDefinition({
      name: "createDebt",
      prepare: () =>
        Promise.reject(
          new ApiException(
            ErrorCode.REFERENCE_PENDING,
            HttpStatus.CONFLICT,
            'No encontré ningún activo que coincida con "Ford".',
          ),
        ),
    });
    const { service, propose } = buildHarness(
      streamWithCalls([
        toolCall("createAsset", "call-1"),
        toolCall("createDebt", "call-2", '{"asset":"Ford"}'),
        toolCall("createDebt", "call-3", '{"asset":"Ford"}'),
      ]),
      (name) => (name === "createAsset" ? createAsset : createDebt),
    );

    await collect(service);
    // asset + one deferred debt (the second identical debt is deduplicated)
    expect(propose).toHaveBeenCalledTimes(2);
  });

  it("executes read tools and records them for audit", async () => {
    const readDefinition: ToolDefinition = {
      name: "listAccounts",
      title: "Listar cuentas",
      description: "d",
      classification: "read",
      parameters: { type: "object", properties: {} },
      execute: () => Promise.resolve({ ok: true, summary: "x" }),
    };
    const { service, recordRead, registry } = buildHarness(
      streamWithCalls([toolCall("listAccounts")]),
      () => readDefinition,
    );

    const events = await collect(service);

    expect(registry.executeRead).toHaveBeenCalled();
    expect(recordRead).toHaveBeenCalled();
    expect(events.some((event) => event.type === "action_proposal")).toBe(
      false,
    );
  });

  it("reports destructive tools as disabled when the user has not opted in", async () => {
    const destructive = writeDefinition({ classification: "destructive" });
    const { service } = buildHarness(
      streamWithCalls([toolCall("createTransaction")]),
      () => destructive,
    );
    const events = await collect(service);
    const error = events.find((event) => event.type === "action_error");
    expect(error).toBeDefined();
    if (error?.type === "action_error") {
      expect(error.data.code).toBe(ErrorCode.DESTRUCTIVE_DISABLED);
    }
  });

  it("reports a write tool without prepare as unavailable", async () => {
    const noPrepare = writeDefinition({ prepare: undefined });
    const { service } = buildHarness(
      streamWithCalls([toolCall("createTransaction")]),
      () => noPrepare,
    );
    const events = await collect(service);
    const error = events.find((event) => event.type === "action_error");
    if (error?.type === "action_error") {
      expect(error.data.code).toBe(ErrorCode.ACTION_NOT_ALLOWED);
    }
    expect(error).toBeDefined();
  });

  it("ignores calls to unknown tools", async () => {
    const { service, propose } = buildHarness(
      streamWithCalls([toolCall("mystery")]),
      () => undefined,
    );
    const events = await collect(service);
    expect(propose).not.toHaveBeenCalled();
    expect(events.at(-1)?.type).toBe("done");
  });

  it("marks the answer as insufficient when the model returns nothing", async () => {
    const { service } = buildHarness(
      () =>
        (async function* (): AsyncGenerator<AiStreamChunk> {
          // no output
        })(),
      () => undefined,
    );
    const events = await collect(service);
    const done = events.find((event) => event.type === "done");
    if (done?.type === "done") {
      expect(done.data.insufficient).toBe(true);
    }
  });

  it("reuses an existing conversation and rejects an unknown one", async () => {
    const { service, conversationsRepository } = buildHarness(
      streamWithCalls([], "hola"),
      () => undefined,
    );
    conversationsRepository.findOneBy.mockResolvedValue({
      id: "conv-1",
      userId: "user-1",
      question: "q",
      answer: "a",
      contextMeta: {},
      messages: [],
      createdAt: new Date(),
    });

    const events: AssistantEvent[] = [];
    for await (const event of service.answer("user-1", {
      question: "hola",
      conversationId: "conv-1",
    } as any)) {
      events.push(event);
    }
    expect(conversationsRepository.save).toHaveBeenCalled();

    conversationsRepository.findOneBy.mockResolvedValue(null);
    await expect(
      (async () => {
        for await (const _event of service.answer("user-1", {
          question: "hola",
          conversationId: "missing",
        } as any)) {
          void _event;
        }
      })(),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });
  });
});

describe("AssistantService session and history", () => {
  it("resolves the dev user id and validates the AI flag", async () => {
    const { service, usersService, config } = buildHarness(
      streamWithCalls([], "x"),
      () => undefined,
    );

    await expect(service.resolveUserId("explicit")).resolves.toBe("explicit");
    await expect(service.resolveUserId()).resolves.toBe("user-1");

    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.resolveUserId()).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });

    config.get.mockImplementation((key: string) =>
      key === "nodeEnv"
        ? "production"
        : { devUserEmail: "demo@atlassfin.app", actionTtlMs: 120000 },
    );
    await expect(service.resolveUserId()).rejects.toMatchObject({
      response: { code: ErrorCode.UNAUTHENTICATED },
    });
  });

  it("rejects when the assistant is disabled", async () => {
    const { service, usersService } = buildHarness(
      streamWithCalls([], "x"),
      () => undefined,
    );
    usersService.getById.mockResolvedValue({
      id: "user-1",
      aiEnabled: false,
    });
    await expect(service.assertAiEnabled("user-1")).rejects.toMatchObject({
      response: { code: ErrorCode.AI_DISABLED },
    });
  });

  it("lists, gets and deletes conversations", async () => {
    const { service, conversationsRepository } = buildHarness(
      streamWithCalls([], "x"),
      () => undefined,
    );
    conversationsRepository.findAndCount.mockResolvedValue([
      [
        {
          id: "conv-1",
          userId: "user-1",
          question: "q",
          answer: "a",
          contextMeta: {},
          createdAt: new Date(),
        },
      ],
      1,
    ]);

    const page = await service.listConversations("user-1", {
      page: 1,
      pageSize: 20,
    } as any);
    expect(page.total).toBe(1);

    conversationsRepository.findOneBy.mockResolvedValue({
      id: "conv-1",
      userId: "user-1",
      question: "q",
      answer: "a",
      contextMeta: {},
      createdAt: new Date(),
    });
    await expect(
      service.getConversation("user-1", "conv-1"),
    ).resolves.toMatchObject({
      id: "conv-1",
    });

    conversationsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.getConversation("user-1", "x")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });

    await service.deleteConversation("user-1", "conv-1");
    conversationsRepository.delete.mockResolvedValue({ affected: 0 });
    await expect(
      service.deleteConversation("user-1", "x"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
    await service.deleteConversations("user-1");
  });

  it("delegates confirm/cancel to pending actions", async () => {
    const { service, pendingActions } = buildHarness(
      streamWithCalls([], "x"),
      () => undefined,
    );
    (pendingActions as any).confirm = jest
      .fn()
      .mockResolvedValue({ status: "executed" });
    (pendingActions as any).cancel = jest
      .fn()
      .mockResolvedValue({ status: "cancelled" });

    await expect(
      service.confirmAction("user-1", "a1", "t"),
    ).resolves.toMatchObject({
      status: "executed",
    });
    await expect(
      service.cancelAction("user-1", "a1", "t"),
    ).resolves.toMatchObject({
      status: "cancelled",
    });
  });
});

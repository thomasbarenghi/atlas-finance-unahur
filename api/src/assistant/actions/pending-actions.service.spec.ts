import { createHash } from "crypto";
import { ConfigService } from "@nestjs/config";
import { DataSource, Repository } from "typeorm";
import type { AppConfig } from "../../config/configuration";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { User } from "../../users/entities/user.entity";
import { ToolRegistry } from "../tools/tool-registry.service";
import type { ToolDefinition } from "../tools/tool.types";
import { AssistantAction } from "../entities/assistant-action.entity";
import { PendingActionsService } from "./pending-actions.service";

const hash = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const user = {
  id: "user-1",
  assistantDestructiveEnabled: false,
} as User;

const definition = (
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition => ({
  name: "createAccount",
  title: "Crear cuenta",
  description: "Crea una cuenta",
  classification: "write_safe",
  parameters: { type: "object", properties: {} },
  execute: () => Promise.resolve({ ok: true, summary: "ok" }),
  ...overrides,
});

const action = (overrides: Partial<AssistantAction> = {}): AssistantAction => ({
  id: "action-1",
  userId: "user-1",
  user,
  conversationId: "conv-1",
  planId: "plan-1",
  step: 1,
  resolved: true,
  toolName: "createAccount",
  classification: "write_safe",
  args: { name: "Caja" },
  preview: { title: "Crear cuenta", summary: "s", fields: [] },
  status: "proposed",
  tokenHash: hash("good-token"),
  result: null,
  errorMessage: null,
  expiresAt: new Date(Date.now() + 60_000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

interface Harness {
  service: PendingActionsService;
  repository: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  run: jest.Mock;
}

const buildHarness = (
  stored: AssistantAction,
  tool: ToolDefinition = definition(),
  siblings: AssistantAction[] = [],
): Harness => {
  const repository = {
    findOne: jest.fn().mockResolvedValue(stored),
    find: jest.fn().mockResolvedValue(siblings),
    create: jest.fn((value: any) => ({ ...value, id: value.id ?? "action-1" })),
    save: jest.fn((value: any) =>
      Promise.resolve({ ...value, id: value.id ?? "action-1" }),
    ),
  };
  const manager = { getRepository: jest.fn().mockReturnValue(repository) };
  const dataSource = {
    transaction: jest.fn((callback: (m: unknown) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;

  const registry = {
    get: jest.fn().mockReturnValue(tool),
  } as unknown as ToolRegistry;

  const config = {
    get: jest.fn().mockReturnValue({ actionTtlMs: 120_000 }),
  } as unknown as ConfigService<AppConfig, true>;

  const service = new PendingActionsService(
    repository as unknown as Repository<AssistantAction>,
    dataSource,
    registry,
    config,
  );

  return { service, repository, run: repository.save };
};

describe("PendingActionsService.confirm", () => {
  it("rejects an invalid confirmation token", async () => {
    const { service } = buildHarness(action());

    await expect(
      service.confirm(user, "action-1", "bad"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });
  });

  it("persists the expired status and rejects", async () => {
    const { service, repository } = buildHarness(
      action({ expiresAt: new Date(Date.now() - 1_000) }),
    );

    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({ response: { code: ErrorCode.ACTION_EXPIRED } });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "expired" }),
    );
  });

  it("rejects a second execution", async () => {
    const { service } = buildHarness(action({ status: "executed" }));

    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_ALREADY_EXECUTED },
    });
  });

  it("blocks when an earlier step of the plan is not completed", async () => {
    const { service } = buildHarness(action(), definition(), [
      action({ id: "action-0", step: 0, status: "proposed" }),
    ]);

    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_DEPENDENCY_PENDING },
    });
  });

  it("executes the action when the plan order is satisfied", async () => {
    const execute = jest.fn().mockResolvedValue({ ok: true, summary: "hecho" });
    const { service, repository } = buildHarness(
      action(),
      definition({ execute }),
      [action({ id: "action-0", step: 0, status: "executed" })],
    );

    const result = await service.confirm(user, "action-1", "good-token");

    expect(execute).toHaveBeenCalled();
    expect(result.status).toBe("executed");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "executed" }),
    );
  });

  it("refuses destructive tools when the user flag is off", async () => {
    const { service } = buildHarness(
      action({ classification: "destructive" }),
      definition({ classification: "destructive" }),
    );

    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.DESTRUCTIVE_DISABLED },
    });
  });

  it("records read executions for audit", async () => {
    const { service, repository } = buildHarness(action());

    await service.recordRead(
      user,
      "conv-1",
      definition({ name: "listAccounts", classification: "read" }),
      { page: 1 },
      "3 cuentas",
    );

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: "listAccounts",
        classification: "read",
        status: "executed",
        tokenHash: null,
        planId: null,
      }),
    );
  });

  it("maps an unresolved reference of a deferred action to ACTION_DEPENDENCY_PENDING", async () => {
    const tool = definition({
      prepare: () =>
        Promise.reject(
          new ApiException(
            ErrorCode.REFERENCE_PENDING,
            409,
            'No encontré ningún activo que coincida con "Ford Ranger".',
          ),
        ),
    });
    const { service } = buildHarness(
      action({ resolved: false, args: { name: "x", asset: "Ford Ranger" } }),
      tool,
    );

    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_DEPENDENCY_PENDING },
    });
  });
});

describe("PendingActionsService.propose", () => {
  it("stores a resolved proposal with a one-time token", async () => {
    const { service, repository } = buildHarness(action());
    const proposal = await service.propose({
      user: user as any,
      conversationId: "conv-1",
      definition: definition(),
      rawArgs: { name: "Caja" },
      prepared: {
        args: { name: "Caja" },
        summary: "s",
        preview: { title: "t", summary: "s", fields: [] },
      },
      preview: { title: "t", summary: "s", fields: [] },
      summary: "Crear cuenta",
      planId: "plan-1",
      step: 0,
    });

    expect(proposal.actionId).toBe("action-1");
    expect(typeof proposal.token).toBe("string");
    expect(proposal.pending).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "proposed", resolved: true }),
    );
  });

  it("marks a proposal as pending when references are unresolved", async () => {
    const { service } = buildHarness(action());
    const proposal = await service.propose({
      user: user as any,
      conversationId: null,
      definition: definition(),
      rawArgs: { name: "x", asset: "Ford" },
      prepared: null,
      preview: { title: "t", summary: "s", fields: [] },
      summary: "s",
      planId: null,
      step: 0,
    });
    expect(proposal.pending).toBe(true);
  });
});

describe("PendingActionsService.confirm edge cases", () => {
  it("rejects an unknown action", async () => {
    const { service, repository } = buildHarness(action());
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.confirm(user, "missing", "good-token"),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });
  });

  it("rejects cancelled/expired actions and definitions without execute", async () => {
    const cancelled = buildHarness(action({ status: "cancelled" }));
    await expect(
      cancelled.service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });

    const noExecute = buildHarness(
      action(),
      definition({ execute: undefined }),
    );
    await expect(
      noExecute.service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });
  });

  it("allows destructive actions when the user opted in", async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ ok: true, summary: "borrado" });
    const { service } = buildHarness(
      action({ classification: "destructive" }),
      definition({ classification: "destructive", execute }),
    );
    const result = await service.confirm(
      { id: "user-1", assistantDestructiveEnabled: true },
      "action-1",
      "good-token",
    );
    expect(result.status).toBe("executed");
  });

  it("skips plan ordering when the action has no plan", async () => {
    const { service } = buildHarness(action({ planId: null }));
    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).resolves.toMatchObject({ status: "executed" });
  });

  it("returns a failed result when the tool throws", async () => {
    const apiError = definition({
      execute: () =>
        Promise.reject(
          new ApiException(ErrorCode.VALIDATION_ERROR, 400, "no", {
            a: ["b"],
          }),
        ),
    });
    const { service } = buildHarness(action(), apiError);
    const result = await service.confirm(user, "action-1", "good-token");
    expect(result.status).toBe("failed");
    expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("maps unexpected execution errors to INTERNAL_ERROR", async () => {
    const boom = definition({
      execute: () => Promise.reject(new Error("boom")),
    });
    const { service } = buildHarness(action(), boom);
    const result = await service.confirm(user, "action-1", "good-token");
    expect(result.status).toBe("failed");
    expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("re-resolves a deferred action before executing", async () => {
    const prepare = jest.fn().mockResolvedValue({
      args: { name: "resolved" },
      preview: { title: "t", summary: "s", fields: [] },
    });
    const { service, repository } = buildHarness(
      action({ resolved: false, args: { name: "raw" } }),
      definition({ prepare }),
    );
    await service.confirm(user, "action-1", "good-token");
    expect(prepare).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
  });

  it("rejects a deferred action without a prepare step", async () => {
    const { service } = buildHarness(
      action({ resolved: false }),
      definition({ prepare: undefined }),
    );
    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });
  });

  it("rethrows unexpected prepare errors", async () => {
    const { service } = buildHarness(
      action({ resolved: false }),
      definition({ prepare: () => Promise.reject(new Error("boom")) }),
    );
    await expect(
      service.confirm(user, "action-1", "good-token"),
    ).rejects.toThrow(/boom/);
  });
});

describe("PendingActionsService.cancel", () => {
  it("cancels a proposed action", async () => {
    const { service, repository } = buildHarness(action());
    const result = await service.cancel(user, "action-1", "good-token");
    expect(result.status).toBe("cancelled");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("rejects unknown actions, invalid tokens and non-cancellable states", async () => {
    const missing = buildHarness(action());
    missing.repository.findOne.mockResolvedValue(null);
    await expect(
      missing.service.cancel(user, "action-1", "good-token"),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });

    const badToken = buildHarness(action());
    await expect(
      badToken.service.cancel(user, "action-1", "bad"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });

    const executed = buildHarness(action({ status: "executed" }));
    await expect(
      executed.service.cancel(user, "action-1", "good-token"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.ACTION_NOT_ALLOWED },
    });
  });
});

describe("PendingActionsService.recordRead", () => {
  it("swallows audit failures", async () => {
    const { service, repository } = buildHarness(action());
    repository.save.mockRejectedValue(new Error("db down"));
    await expect(
      service.recordRead(
        user,
        "conv-1",
        definition({ name: "listAccounts", classification: "read" }),
        {},
        "ok",
      ),
    ).resolves.toBeUndefined();
  });
});

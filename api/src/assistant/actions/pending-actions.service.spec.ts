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
    create: jest.fn((value: unknown) => value),
    save: jest.fn((value: unknown) => Promise.resolve(value)),
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

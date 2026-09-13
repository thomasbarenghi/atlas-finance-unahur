import { ApiException } from "../../common/errors/api.exception";
import type { User } from "../../users/entities/user.entity";
import { AccountTools } from "./domains/account.tools";
import { AssetTools } from "./domains/asset.tools";
import { BudgetTools } from "./domains/budget.tools";
import { CategoryTools } from "./domains/category.tools";
import { DebtTools } from "./domains/debt.tools";
import { GoalTools } from "./domains/goal.tools";
import { InsightTools } from "./domains/insight.tools";
import { PositionTools } from "./domains/position.tools";
import { ProfileTools } from "./domains/profile.tools";
import { TransactionTools } from "./domains/transaction.tools";
import type { ToolDefinition } from "./tool.types";
import { ToolRegistry } from "./tool-registry.service";

const definition = (
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition => ({
  name: "listAccounts",
  title: "Listar cuentas",
  description: "Lista cuentas",
  classification: "read",
  parameters: { type: "object", properties: {} },
  execute: () => Promise.resolve({ ok: true, summary: "ok" }),
  ...overrides,
});

const stub = (definitions: ToolDefinition[]) => ({
  definitions: () => definitions,
});

const buildRegistry = (definitions: ToolDefinition[]): ToolRegistry =>
  new ToolRegistry(
    stub(definitions) as unknown as AccountTools,
    stub([]) as unknown as CategoryTools,
    stub([]) as unknown as TransactionTools,
    stub([]) as unknown as BudgetTools,
    stub([]) as unknown as AssetTools,
    stub([]) as unknown as DebtTools,
    stub([]) as unknown as PositionTools,
    stub([]) as unknown as GoalTools,
    stub([]) as unknown as ProfileTools,
    stub([]) as unknown as InsightTools,
  );

const user = (assistantDestructiveEnabled: boolean): User =>
  ({ id: "user-1", assistantDestructiveEnabled }) as User;

describe("ToolRegistry", () => {
  it("exposes read and safe tools but hides destructive ones by default", () => {
    const registry = buildRegistry([
      definition({ name: "listAccounts", classification: "read" }),
      definition({ name: "createAccount", classification: "write_safe" }),
      definition({ name: "deletePosition", classification: "destructive" }),
    ]);

    const names = registry.toAiTools(user(false)).map((t) => t.function.name);

    expect(names).toContain("listAccounts");
    expect(names).toContain("createAccount");
    expect(names).not.toContain("deletePosition");
  });

  it("exposes destructive tools when the user enabled them", () => {
    const registry = buildRegistry([
      definition({ name: "deletePosition", classification: "destructive" }),
    ]);

    const names = registry.toAiTools(user(true)).map((t) => t.function.name);

    expect(names).toContain("deletePosition");
  });

  it("rejects duplicate tool names", () => {
    expect(() =>
      buildRegistry([
        definition({ name: "listAccounts" }),
        definition({ name: "listAccounts" }),
      ]),
    ).toThrow(/Duplicate assistant tool/);
  });

  it("returns undefined for an unknown tool", () => {
    const registry = buildRegistry([definition()]);
    expect(registry.get("nope")).toBeUndefined();
  });

  it("builds a catalog grouped by domain", () => {
    const registry = buildRegistry([
      definition({ name: "listAccounts" }),
      definition({ name: "createAccount" }),
    ]);

    const catalog = registry.catalog(user(false));

    expect(catalog).toContain("Cuentas");
    expect(catalog).toContain("createAccount");
  });

  it("omits destructive tools from the catalog when disabled", () => {
    const registry = buildRegistry([
      definition({ name: "createAccount" }),
      definition({ name: "deletePosition", classification: "destructive" }),
    ]);

    expect(registry.catalog(user(false))).not.toContain("deletePosition");
    expect(registry.catalog(user(true))).toContain("deletePosition");
  });

  it("executes a read tool and wraps the result", async () => {
    const registry = buildRegistry([
      definition({
        execute: () =>
          Promise.resolve({ ok: true, summary: "2 cuentas", data: [] }),
      }),
    ]);

    const result = await registry.executeRead("user-1", {
      id: "call-1",
      type: "function",
      function: { name: "listAccounts", arguments: "{}" },
    });

    expect(result).toMatchObject({
      toolCallId: "call-1",
      name: "listAccounts",
      mutates: false,
      ok: true,
    });
  });

  it("fails closed when the requested tool is unknown", async () => {
    const registry = buildRegistry([definition()]);
    await expect(
      registry.executeRead("user-1", {
        id: "call-1",
        type: "function",
        function: { name: "missingTool", arguments: "{}" },
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });
});

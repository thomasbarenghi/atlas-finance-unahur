import { AccountsService } from "../../accounts/accounts.service";
import { AssetsService } from "../../assets/assets.service";
import { BudgetsOrchestrator } from "../../budgets/budgets.orchestrator";
import { CategoriesService } from "../../categories/categories.service";
import { ApiException } from "../../common/errors/api.exception";
import { DebtsService } from "../../debts/debts.service";
import { GoalsService } from "../../goals/goals.service";
import { PositionsOrchestrator } from "../../positions/positions.orchestrator";
import { ReferenceResolver } from "./reference-resolver.service";
interface AccountStub {
  id: string;
  name: string;
}

const buildResolver = (
  accounts: AccountStub[] = [],
): { resolver: ReferenceResolver; listAccounts: jest.Mock } => {
  const listAccounts = jest.fn().mockResolvedValue(accounts);

  const resolver = new ReferenceResolver(
    { listAccounts } as unknown as AccountsService,
    { listCategories: jest.fn() } as unknown as CategoriesService,
    { listAssets: jest.fn() } as unknown as AssetsService,
    { listDebts: jest.fn() } as unknown as DebtsService,
    { listPositions: jest.fn() } as unknown as PositionsOrchestrator,
    { listGoals: jest.fn() } as unknown as GoalsService,
    { listBudgets: jest.fn() } as unknown as BudgetsOrchestrator,
  );

  return { resolver, listAccounts };
};

describe("ReferenceResolver", () => {
  it("resolves an account by exact name, ignoring case and accents", async () => {
    const { resolver } = buildResolver([{ id: "a1", name: "Banco Galicía" }]);

    await expect(
      resolver.resolveAccountId("user-1", "banco galicia"),
    ).resolves.toBe("a1");
  });

  it("resolves an account by id when it belongs to the user", async () => {
    const accountId = "11111111-1111-1111-1111-111111111111";
    const { resolver } = buildResolver([{ id: accountId, name: "Caja" }]);

    await expect(resolver.resolveAccountId("user-1", accountId)).resolves.toBe(
      accountId,
    );
  });

  it("scopes the lookup to the authenticated user", async () => {
    const { resolver, listAccounts } = buildResolver([
      { id: "a1", name: "Caja" },
    ]);

    await resolver.resolveAccountId("user-42", "Caja");

    expect(listAccounts).toHaveBeenCalledWith("user-42");
  });

  it("rejects an id that is not among the user's accounts", async () => {
    const { resolver } = buildResolver([{ id: "a1", name: "Caja" }]);

    await expect(
      resolver.resolveAccountId(
        "user-1",
        "11111111-1111-1111-1111-111111111111",
      ),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it("fails instead of guessing when several accounts match", async () => {
    const { resolver } = buildResolver([
      { id: "a1", name: "Banco" },
      { id: "a2", name: "Banco" },
    ]);

    await expect(resolver.resolveAccountId("user-1", "Banco")).rejects.toThrow(
      /varias/,
    );
  });

  it("fails when nothing matches", async () => {
    const { resolver } = buildResolver([{ id: "a1", name: "Caja" }]);

    await expect(
      resolver.resolveAccountId("user-1", "Inexistente"),
    ).rejects.toThrow(/No encontré/);
  });
});

const buildFullResolver = () => {
  const accounts = {
    listAccounts: jest.fn().mockResolvedValue([{ id: "a1", name: "Caja" }]),
  };
  const categories = {
    listCategories: jest.fn().mockResolvedValue([
      { id: "c1", name: "Comida", type: "expense" },
      { id: "c2", name: "Sueldo", type: "income" },
    ]),
  };
  const assets = {
    listAssets: jest.fn().mockResolvedValue([{ id: "as1", name: "Depto" }]),
  };
  const debts = {
    listDebts: jest.fn().mockResolvedValue([{ id: "d1", name: "Hipoteca" }]),
  };
  const positions = {
    listPositions: jest
      .fn()
      .mockResolvedValue([{ id: "p1", symbol: "BTC", instrument: "Bitcoin" }]),
  };
  const goals = {
    listGoals: jest.fn().mockResolvedValue([{ id: "g1", name: "Vacaciones" }]),
  };
  const budgets = {
    listBudgets: jest
      .fn()
      .mockResolvedValue([
        { id: "b1", category: { name: "Comida" }, period: "2026-03-01" },
      ]),
  };
  const resolver = new ReferenceResolver(
    accounts as any,
    categories as any,
    assets as any,
    debts as any,
    positions as any,
    goals as any,
    budgets as any,
  );
  return { resolver, categories };
};

const UNKNOWN_UUID = "00000000-0000-4000-8000-000000000009";

describe("ReferenceResolver domain lookups", () => {
  it("resolves categories scoped by type", async () => {
    const { resolver } = buildFullResolver();
    await expect(resolver.resolveCategoryId("u1", "Comida")).resolves.toBe(
      "c1",
    );
    await expect(
      resolver.resolveCategoryId("u1", "Sueldo", "income"),
    ).resolves.toBe("c2");
    await expect(
      resolver.resolveCategoryId("u1", "Sueldo", "expense"),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it("resolves assets, debts, positions, goals and budgets", async () => {
    const { resolver } = buildFullResolver();
    await expect(resolver.resolveAssetId("u1", "Depto")).resolves.toBe("as1");
    await expect(resolver.resolveDebtId("u1", "Hipoteca")).resolves.toBe("d1");
    await expect(resolver.resolvePositionId("u1", "Bitcoin")).resolves.toBe(
      "p1",
    );
    await expect(resolver.resolvePositionId("u1", "BTC")).resolves.toBe("p1");
    await expect(resolver.resolveGoalId("u1", "Vacaciones")).resolves.toBe(
      "g1",
    );
    await expect(
      resolver.resolveBudgetId("u1", "Comida", "2026-03"),
    ).resolves.toBe("b1");
  });

  it("rejects an unknown uuid", async () => {
    const { resolver } = buildFullResolver();
    await expect(
      resolver.resolveAssetId("u1", UNKNOWN_UUID),
    ).rejects.toMatchObject({
      response: { code: "NOT_FOUND" },
    });
    await expect(
      resolver.resolveDebtId("u1", UNKNOWN_UUID),
    ).rejects.toMatchObject({
      response: { code: "NOT_FOUND" },
    });
  });

  it("fails with ambiguity on partial matches", async () => {
    const { resolver, categories } = buildFullResolver();
    categories.listCategories.mockResolvedValue([
      { id: "c1", name: "Comida rápida", type: "expense" },
      { id: "c2", name: "Comida casera", type: "expense" },
    ]);
    await expect(
      resolver.resolveCategoryId("u1", "comi"),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
  });

  it("requires a reference value", async () => {
    const { resolver } = buildFullResolver();
    await expect(resolver.resolveAssetId("u1", "")).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
  });
});

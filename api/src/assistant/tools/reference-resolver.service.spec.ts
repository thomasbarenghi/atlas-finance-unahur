import { AccountsService } from "../../accounts/accounts.service";
import { AssetsService } from "../../assets/assets.service";
import { BudgetsService } from "../../budgets/budgets.service";
import { CategoriesService } from "../../categories/categories.service";
import { ApiException } from "../../common/errors/api.exception";
import { DebtsService } from "../../debts/debts.service";
import { GoalsService } from "../../goals/goals.service";
import { PositionsService } from "../../positions/positions.service";
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
    { listPositions: jest.fn() } as unknown as PositionsService,
    { listGoals: jest.fn() } as unknown as GoalsService,
    { listBudgets: jest.fn() } as unknown as BudgetsService,
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

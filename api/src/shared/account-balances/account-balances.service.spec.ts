import { mockRepository } from "../../../test/unit/mocks";
import { AccountBalancesService } from "./account-balances.service";

const build = () => {
  const repository = mockRepository();
  const service = new AccountBalancesService(repository as any);
  return { service, repository };
};

describe("AccountBalancesService", () => {
  it("computes an account balance applying expenses and transfers", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      { type: "income", amount: 500 },
      { type: "expense", amount: 200 },
      { type: "transfer", amount: -300 },
    ]);
    const balance = await service.currentBalanceOf(
      { id: "a1", initialBalance: 1000 } as any,
      "u1",
    );
    expect(balance).toBe(1000); // 1000 + 500 - 200 - 300
  });

  it("aggregates signed totals per account", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      { accountId: "a1", type: "income", amount: 100 },
      { accountId: "a1", type: "expense", amount: 30 },
      { accountId: "a2", type: "transfer", amount: -50 },
    ]);
    const totals = await service.signedTotalsByAccount("u1");
    expect(totals.get("a1")).toBe(70);
    expect(totals.get("a2")).toBe(-50);
  });
});

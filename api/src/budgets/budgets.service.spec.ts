import { ErrorCode } from "../common/errors/error-codes";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
import { Budget } from "./entities/budget.entity";
import { BudgetsService, monthOf, normalizePeriod } from "./budgets.service";

const budget = (overrides: Partial<Budget> = {}): Budget =>
  ({
    id: "b1",
    userId: "u1",
    categoryId: "c1",
    period: "2026-03-01",
    limit: 1000,
    currency: "ARS",
    recurring: false,
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    ...overrides,
  }) as Budget;

const build = () => {
  const repository = mockRepository();
  repository.create.mockImplementation((value: any) => budget(value));
  repository.save.mockImplementation(async (value: any) => budget(value));
  const service = new BudgetsService(repository as any, mockCurrency() as any);
  return { service, repository };
};

describe("BudgetsService", () => {
  it("normalizes a period to the first day of the month", () => {
    expect(normalizePeriod("2026-03-15")).toBe("2026-03-01");
    expect(monthOf("2026-03-01")).toBe("2026-03");
  });

  it("lists owned budgets", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([budget()]);
    await expect(service.listOwnedBudgets("u1")).resolves.toHaveLength(1);
  });

  it("creates a budget and rejects duplicates", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    const created = await service.createBudget("u1", {
      categoryId: "c1",
      period: "2026-03",
      limit: 1000,
      currency: "ars",
    } as any);
    expect(created).toMatchObject({
      period: "2026-03-01",
      currency: "ARS",
      recurring: false,
    });

    repository.findOneBy.mockResolvedValue(budget());
    await expect(
      service.createBudget("u1", {
        categoryId: "c1",
        period: "2026-03",
        limit: 1,
        currency: "ARS",
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.DUPLICATE_BUDGET } });
  });

  it("creates a recurring budget", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    const created = await service.createBudget("u1", {
      categoryId: "c1",
      period: "2026-03",
      limit: 1,
      currency: "ARS",
      recurring: true,
    } as any);
    expect(created.recurring).toBe(true);
  });

  it("updates and deletes a budget", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(budget());
    const updated = await service.updateBudget("u1", "b1", {
      limit: 2000,
      recurring: true,
    } as any);
    expect(updated).toMatchObject({ limit: 2000, recurring: true });

    await service.deleteBudget("u1", "b1");
    expect(repository.delete).toHaveBeenCalledWith({ id: "b1", userId: "u1" });

    repository.delete.mockResolvedValue({ affected: 0 });
    await expect(service.deleteBudget("u1", "x")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("copies the previous month skipping existing categories", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      budget({ id: "prev", categoryId: "c1", period: "2026-02-01" }),
      budget({ id: "explicit", categoryId: "c2", period: "2026-03-01" }),
      budget({ id: "other", categoryId: "c2", period: "2026-02-01" }),
    ]);
    repository.save.mockImplementation(async (value: any) => value);

    const copies = await service.copyPreviousBudgets("u1", {
      period: "2026-03",
    } as any);
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({ categoryId: "c1", period: "2026-03-01" });

    repository.find.mockResolvedValue([]);
    await expect(
      service.copyPreviousBudgets("u1", { period: "2026-03" } as any),
    ).resolves.toEqual([]);
  });

  it("projects explicit budgets plus the latest recurring template", () => {
    const { service } = build();
    const budgets = [
      budget({ id: "explicit", categoryId: "c1", period: "2026-03-01" }),
      budget({
        id: "rec-old",
        categoryId: "c2",
        period: "2026-01-01",
        recurring: true,
      }),
      budget({
        id: "rec-new",
        categoryId: "c2",
        period: "2026-02-01",
        recurring: true,
      }),
      budget({
        id: "future",
        categoryId: "c3",
        period: "2026-05-01",
        recurring: true,
      }),
    ];

    const projected = service.projectForMonth(budgets, "2026-03");
    expect(projected.map((b) => b.id).sort()).toEqual(["explicit", "rec-new"]);
    expect(projected.find((b) => b.id === "rec-new")?.period).toBe(
      "2026-03-01",
    );
  });
});

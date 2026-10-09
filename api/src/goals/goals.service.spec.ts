import { ErrorCode } from "../common/errors/error-codes";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
import { Goal } from "./entities/goal.entity";
import { GoalsService } from "./goals.service";
import { GoalsOrchestrator } from "./goals.orchestrator";

const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: "g1",
    userId: "u1",
    name: "Vacaciones",
    targetAmount: 1000,
    savedAmount: 250,
    currency: "ARS",
    targetDate: null,
    sourceAccountId: null,
    archived: false,
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    ...overrides,
  }) as Goal;

describe("GoalsService", () => {
  const build = () => {
    const repository = mockRepository();
    repository.create.mockImplementation((value: any) => goal(value));
    repository.save.mockImplementation(async (value: any) => goal(value));
    const calculations = {
      calculateGoalProgress: jest.fn(() => ({
        progressPct: 25,
        status: "in_progress",
      })),
    };
    const service = new GoalsService(
      repository as any,
      calculations as any,
      mockCurrency() as any,
    );
    return { service, repository, calculations };
  };

  it("lists goals with server-computed progress", async () => {
    const { service, repository, calculations } = build();
    repository.find.mockResolvedValue([goal()]);
    const [result] = await service.listGoals("u1");
    expect(result.progressPct).toBe(25);
    expect(calculations.calculateGoalProgress).toHaveBeenCalled();
  });

  it("creates a goal defaulting the saved amount to 0", async () => {
    const { service } = build();
    const created = await service.createGoal("u1", {
      name: "  Meta  ",
      targetAmount: 1000,
      currency: "ars",
    } as any);
    expect(created.savedAmount).toBe(0);
    expect(created.currency).toBe("ARS");
  });

  it("updates, contributes, archives and restores", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(goal());

    expect(
      (await service.updateGoal("u1", "g1", { savedAmount: 500 } as any))
        .savedAmount,
    ).toBe(500);
    expect((await service.contributeToGoal("u1", "g1", 100)).savedAmount).toBe(
      600,
    );
    expect((await service.archiveGoal("u1", "g1")).archived).toBe(true);
    expect((await service.restoreGoal("u1", "g1")).archived).toBe(false);
  });

  it("updates each optional field independently", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(goal());

    await service.updateGoal("u1", "g1", { name: "N" } as any);
    await service.updateGoal("u1", "g1", { targetAmount: 5 } as any);
    await service.updateGoal("u1", "g1", { savedAmount: 5 } as any);
    await service.updateGoal("u1", "g1", { currency: "usd" } as any);
    await service.updateGoal("u1", "g1", { targetDate: "2030-01-01" } as any);
    await service.updateGoal("u1", "g1", { targetDate: null } as any);
    await service.updateGoal("u1", "g1", { sourceAccountId: null } as any);

    expect(repository.save).toHaveBeenCalledTimes(7);
  });

  it("throws NOT_FOUND when the goal is missing", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.getGoal("u1", "x")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});

describe("GoalsOrchestrator", () => {
  const build = () => {
    const goalsService = {
      createGoal: jest.fn(async (_u: string, dto: unknown) => dto),
      updateGoal: jest.fn(async (_u: string, _i: string, dto: unknown) => dto),
    };
    const accountsService = { getAccount: jest.fn(async () => ({})) };
    const orchestrator = new GoalsOrchestrator(
      goalsService as any,
      accountsService as any,
    );
    return { orchestrator, goalsService, accountsService };
  };

  it("validates the source account when provided", async () => {
    const { orchestrator, accountsService } = build();
    await orchestrator.createGoal("u1", { sourceAccountId: "a1" } as any);
    await orchestrator.updateGoal("u1", "g1", { sourceAccountId: "a1" } as any);
    expect(accountsService.getAccount).toHaveBeenCalledWith("u1", "a1");
  });

  it("skips validation otherwise", async () => {
    const { orchestrator, accountsService } = build();
    await orchestrator.createGoal("u1", {} as any);
    await orchestrator.updateGoal("u1", "g1", { name: "x" } as any);
    expect(accountsService.getAccount).not.toHaveBeenCalled();
  });
});

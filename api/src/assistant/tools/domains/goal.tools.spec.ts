import { GoalTools } from "./goal.tools";

const goal = (overrides: Record<string, unknown> = {}) => ({
  id: "g1",
  name: "Vacaciones",
  targetAmount: 1000,
  savedAmount: 100,
  currency: "ARS",
  targetDate: null,
  sourceAccountId: null,
  progressPct: 10,
  status: "in_progress",
  ...overrides,
});

const build = () => {
  const goals = {
    listGoals: jest.fn().mockResolvedValue([goal()]),
    getGoal: jest.fn().mockResolvedValue(goal()),
    contributeToGoal: jest.fn().mockResolvedValue(goal({ savedAmount: 200 })),
    archiveGoal: jest.fn().mockResolvedValue(goal({ archived: true })),
    restoreGoal: jest.fn().mockResolvedValue(goal({ archived: false })),
  };
  const orchestrator = {
    createGoal: jest.fn().mockResolvedValue(goal()),
    updateGoal: jest.fn().mockResolvedValue(goal({ name: "Editada" })),
  };
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const resolver = {
    resolveGoalId: jest.fn().mockResolvedValue("g1"),
    resolveAccountId: jest
      .fn()
      .mockResolvedValue("00000000-0000-4000-8000-000000000001"),
  };
  const tools = new GoalTools(
    goals as any,
    orchestrator as any,
    users as any,
    resolver as any,
  );
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, goals, orchestrator, resolver };
};

describe("GoalTools", () => {
  it("lists goals", async () => {
    const { byName } = build();
    const result = await byName("listGoals").execute!("u1", {});
    expect(result.summary).toContain("1 meta");
  });

  it("prepares and executes createGoal resolving the source account", async () => {
    const { byName, resolver, orchestrator } = build();
    const definition = byName("createGoal");

    const prepared = await definition.prepare!("u1", {
      name: "Meta",
      targetAmount: 1000,
      sourceAccount: "Banco",
    });
    expect(resolver.resolveAccountId).toHaveBeenCalledWith("u1", "Banco");
    expect(prepared.args).toMatchObject({
      currency: "ARS",
      sourceAccountId: "00000000-0000-4000-8000-000000000001",
    });

    const result = await definition.execute!("u1", {
      name: "Meta",
      targetAmount: 1000,
      currency: "ARS",
      sourceAccountId: null,
      targetDate: null,
    });
    expect(orchestrator.createGoal).toHaveBeenCalled();
    expect(result.entity).toMatchObject({ id: "g1" });
  });

  it("treats unset targetDate as null and defaults currency", async () => {
    const { byName } = build();
    const prepared = await byName("createGoal").prepare!("u1", {
      name: "Meta",
      targetAmount: 500,
      targetDate: "ninguno",
    });
    expect(prepared.args).toMatchObject({ targetDate: null, currency: "ARS" });
  });

  it("prepares and executes contributeToGoal", async () => {
    const { byName, goals } = build();
    const definition = byName("contributeToGoal");
    const prepared = await definition.prepare!("u1", {
      goal: "Vacaciones",
      amount: 100,
    });
    expect(prepared.args).toMatchObject({ goal: "g1", amount: 100 });

    const result = await definition.execute!("u1", { goal: "g1", amount: 100 });
    expect(goals.contributeToGoal).toHaveBeenCalledWith("u1", "g1", 100);
    expect(result.ok).toBe(true);
  });

  it("prepares and executes updateGoal, rejecting empty changes", async () => {
    const { byName, orchestrator } = build();
    const definition = byName("updateGoal");

    const prepared = await definition.prepare!("u1", {
      goal: "g1",
      savedAmount: 300,
    });
    expect(prepared.args).toMatchObject({ savedAmount: 300 });

    await expect(
      definition.prepare!("u1", { goal: "g1" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });

    const result = await definition.execute!("u1", {
      goal: "g1",
      savedAmount: 300,
    });
    expect(orchestrator.updateGoal).toHaveBeenCalled();
    expect(result.summary).toContain("Editada");
  });

  it("clears targetDate and sourceAccount when passed empty", async () => {
    const { byName } = build();
    const prepared = await byName("updateGoal").prepare!("u1", {
      goal: "g1",
      targetDate: "",
      sourceAccount: "none",
    });
    expect(prepared.args).toMatchObject({
      targetDate: null,
      sourceAccountId: null,
    });
  });

  it("resolves a source account when provided on update", async () => {
    const { byName, resolver } = build();
    await byName("updateGoal").prepare!("u1", {
      goal: "g1",
      sourceAccount: "Banco",
    });
    expect(resolver.resolveAccountId).toHaveBeenCalledWith("u1", "Banco");
  });

  it("archives and restores a goal", async () => {
    const { byName, goals } = build();
    expect(
      (await byName("archiveGoal").prepare!("u1", { goal: "g1" })).args,
    ).toMatchObject({ goal: "g1" });
    await byName("archiveGoal").execute!("u1", { goal: "g1" });
    await byName("restoreGoal").execute!("u1", { goal: "g1" });
    expect(goals.archiveGoal).toHaveBeenCalledWith("u1", "g1");
    expect(goals.restoreGoal).toHaveBeenCalledWith("u1", "g1");
  });
});

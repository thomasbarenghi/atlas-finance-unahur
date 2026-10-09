import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGoalDetail } from "@/components/features/goals/goal-detail-view/hooks/use-goal-detail";
import { mockState } from "@/lib/mocks/store";
import { renderHookWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

describe("useGoalDetail", () => {
  beforeEach(() => {
    seedMockSession();
  });

  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  it("resolves the goal and its source account", async () => {
    const goal = mockState.goals[0];
    window.history.replaceState({}, "", `/goals/detail?id=${goal.id}`);
    const { result } = renderHookWithProviders(() => useGoalDetail());

    await waitFor(() => expect(result.current.goal?.id).toBe(goal.id));
    expect(result.current.sourceAccount?.id).toBe(goal.sourceAccountId);
  });

  it("returns undefined when the id does not match", async () => {
    window.history.replaceState({}, "", "/goals/detail?id=missing");
    const { result } = renderHookWithProviders(() => useGoalDetail());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goal).toBeUndefined();
    expect(result.current.sourceAccount).toBeUndefined();
  });
});

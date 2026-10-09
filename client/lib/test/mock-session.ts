import { sessionStore } from "@/lib/api/session";
import { mockState, resetMockState } from "@/lib/mocks/store";

/**
 * The client ships with `NEXT_PUBLIC_USE_MOCKS` defaulting to true, so the
 * default data source in tests is the in-memory mock API. Seeding the session
 * makes the mock resolve the seeded demo user (and its owned data).
 */
export const seedMockSession = (): string => {
  const userId = mockState.users[0].user.id;
  sessionStore.setUserId(userId);
  return userId;
};

export const resetMockSession = (): void => {
  resetMockState();
  sessionStore.clear();
};

export const demoCredentials = {
  email: "demo@atlassfin.app",
  password: "Demo1234!",
};

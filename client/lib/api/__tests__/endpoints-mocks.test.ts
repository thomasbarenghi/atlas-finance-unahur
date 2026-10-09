import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockApi } from "@/lib/mocks/api";
import { callAllEndpoints } from "@/lib/test/exercise-endpoints";

/**
 * Exercises every in-memory mock branch of the endpoint layer. The real HTTP
 * branch is covered by `endpoints-all.test.ts`.
 */
describe("endpoint mock wiring", () => {
  const api = mockApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    for (const key of Object.keys(mockApi)) {
      if (typeof (mockApi as Record<string, unknown>)[key] === "function") {
        api[key] = vi.fn().mockResolvedValue({});
      }
    }
  });

  it("routes every endpoint through the in-memory mock", async () => {
    await callAllEndpoints();

    for (const key of Object.keys(mockApi)) {
      if (key === "sendMessage") continue;
      if (typeof (mockApi as Record<string, unknown>)[key] === "function") {
        expect(api[key]).toHaveBeenCalled();
      }
    }
  });
});

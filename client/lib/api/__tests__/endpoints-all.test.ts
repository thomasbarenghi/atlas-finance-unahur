import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost/api";
  process.env.NEXT_PUBLIC_USE_MOCKS = "false";
});

import { callAllEndpoints } from "@/lib/test/exercise-endpoints";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * Exercises every HTTP branch of the endpoint layer against a mocked network
 * boundary, asserting each endpoint resolves with the wire path/method it
 * claims. The in-memory mock branch is covered by
 * `endpoints-mocks.test.ts`.
 */
describe("endpoint HTTP wiring", () => {
  const calls: { method: string; path: string }[] = [];

  beforeEach(() => {
    calls.length = 0;
    server.use(
      http.all(/localhost\/api\//, ({ request }) => {
        const url = new URL(request.url);
        calls.push({ method: request.method, path: url.pathname + url.search });
        if (request.method === "DELETE") {
          return new HttpResponse(null, { status: 204 });
        }
        return HttpResponse.json({});
      }),
    );
  });

  it("calls every endpoint with the expected method and path", async () => {
    await callAllEndpoints();

    expect(calls.length).toBeGreaterThan(40);
    expect(calls).toContainEqual({ method: "POST", path: "/api/auth/login" });
    expect(calls).toContainEqual({ method: "GET", path: "/api/accounts" });
    expect(calls).toContainEqual({
      method: "GET",
      path: "/api/transactions?type=expense",
    });
    expect(calls).toContainEqual({
      method: "GET",
      path: "/api/dashboard?from=2026-01-01&to=2026-01-31",
    });
    expect(calls).toContainEqual({
      method: "DELETE",
      path: "/api/positions/pos-1",
    });
    expect(calls).toContainEqual({
      method: "POST",
      path: "/api/assistant/actions/a-1/confirm",
    });
  });
});

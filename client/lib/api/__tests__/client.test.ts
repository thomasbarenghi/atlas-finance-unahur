import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost/api";
});

import { ApiError, UnauthorizedError, del, get, post } from "@/lib/api/client";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("apiFetch", () => {
  it("parses a JSON response", async () => {
    server.use(
      http.get("http://localhost/api/accounts", () =>
        HttpResponse.json([{ id: "a", name: "Caja" }]),
      ),
    );
    await expect(get("/accounts")).resolves.toEqual([
      { id: "a", name: "Caja" },
    ]);
  });

  it("returns undefined for 204 and empty bodies", async () => {
    server.use(
      http.delete(
        "http://localhost/api/transactions/1",
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    await expect(del("/transactions/1")).resolves.toBeUndefined();
  });

  it("maps a structured API error", async () => {
    server.use(
      http.post("http://localhost/api/accounts", () =>
        HttpResponse.json(
          {
            statusCode: 400,
            code: "VALIDATION_ERROR",
            message: "Datos inválidos",
            fieldErrors: { name: ["Ingresá un nombre"] },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(post("/accounts", {})).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos",
      fieldErrors: { name: ["Ingresá un nombre"] },
    });
  });

  it("falls back to a generic error when the body is not JSON", async () => {
    server.use(
      http.get(
        "http://localhost/api/quotes",
        () => new HttpResponse("<html>500</html>", { status: 500 }),
      ),
    );

    await expect(get("/quotes")).rejects.toMatchObject({
      statusCode: 500,
      code: "INTERNAL_ERROR",
    });
  });

  it("refreshes once on 401 and retries the original request", async () => {
    let attempts = 0;
    server.use(
      http.get("http://localhost/api/accounts", () => {
        attempts += 1;
        if (attempts === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json([{ id: "a" }]);
      }),
      http.post("http://localhost/api/auth/refresh", () =>
        HttpResponse.json({ accessToken: "new", refreshToken: "new-r" }),
      ),
    );

    await expect(get("/accounts")).resolves.toEqual([{ id: "a" }]);
    expect(attempts).toBe(2);
  });

  it("throws UnauthorizedError when refresh fails", async () => {
    server.use(
      http.get(
        "http://localhost/api/accounts",
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        "http://localhost/api/auth/refresh",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(get("/accounts")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("does not try to refresh login/register responses", async () => {
    let refreshCalls = 0;
    server.use(
      http.post(
        "http://localhost/api/auth/login",
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post("http://localhost/api/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json({});
      }),
    );

    await expect(post("/auth/login", {})).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(refreshCalls).toBe(0);
  });

  it("preserves the structured server message on a 401", async () => {
    server.use(
      http.post("http://localhost/api/auth/login", () =>
        HttpResponse.json(
          {
            statusCode: 401,
            code: "INVALID_CREDENTIALS",
            message: "Email o contraseña incorrectos",
          },
          { status: 401 },
        ),
      ),
    );

    await expect(post("/auth/login", {})).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email o contraseña incorrectos",
    });
  });

  it("exposes the ApiError shape", () => {
    const error = new ApiError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "No existe",
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.statusCode).toBe(404);
  });
});

import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { OptionalJwtAuthGuard } from "./optional-jwt-auth.guard";

const buildContext = (): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ headers: {}, cookies: {} }),
      getResponse: () => ({}),
    }),
  }) as any;

describe("JwtAuthGuard", () => {
  it("allows public routes without authentication", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => true),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it("delegates to passport for protected routes", async () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => false),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      Error,
    );
  });
});

describe("OptionalJwtAuthGuard", () => {
  it("returns the user when present and undefined otherwise", () => {
    const guard = new OptionalJwtAuthGuard();
    const user = { id: "u1" };
    expect(guard.handleRequest(null, user)).toBe(user);
    expect(guard.handleRequest(null, undefined)).toBeUndefined();
  });
});

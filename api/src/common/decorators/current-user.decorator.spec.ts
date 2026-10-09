import { ExecutionContext } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { CurrentUser } from "./current-user.decorator";
import { IS_PUBLIC_KEY, Public } from "./public.decorator";

const buildContext = (user?: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

/** Registers the param decorator on a dummy handler and extracts its factory. */
const extractFactory = (data: unknown) => {
  class Dummy {}
  Object.defineProperty(Dummy.prototype, "handler", { value: () => undefined });
  (CurrentUser as any)(data)(Dummy.prototype, "handler", 0);
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Dummy, "handler");
  const entry = Object.values(metadata)[0] as any;
  return entry.factory as (data: unknown, ctx: ExecutionContext) => unknown;
};

describe("CurrentUser decorator", () => {
  it("returns the whole user when no field is requested", () => {
    const factory = extractFactory(undefined);
    const user = { id: "u1", email: "a@test.local" };
    expect(factory(undefined, buildContext(user))).toBe(user);
  });

  it("returns a single field when requested", () => {
    const factory = extractFactory("id");
    expect(factory("id", buildContext({ id: "u1" }))).toBe("u1");
  });

  it("returns undefined when there is no user", () => {
    const factory = extractFactory("id");
    expect(factory("id", buildContext(undefined))).toBeUndefined();
  });
});

describe("Public decorator", () => {
  it("uses a stable metadata key", () => {
    expect(IS_PUBLIC_KEY).toBe("isPublic");
    expect(typeof Public()).toBe("function");
  });
});

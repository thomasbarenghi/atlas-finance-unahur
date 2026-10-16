import { ExecutionContext } from "@nestjs/common";
import { ErrorCode } from "../common/errors/error-codes";
import { AdminGuard } from "./admin.guard";

const context = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ header: (name: string) => headers[name] }),
    }),
  }) as unknown as ExecutionContext;

const build = (adminApiKey: string | null) => {
  const config = { get: jest.fn(() => ({ adminApiKey })) };
  return new AdminGuard(config as any);
};

const catchCode = (run: () => unknown): string | undefined => {
  try {
    run();
    return undefined;
  } catch (error) {
    return (error as { response?: { code?: string } }).response?.code;
  }
};

describe("AdminGuard", () => {
  it("disables the endpoints when no key is configured", () => {
    const guard = build(null);
    expect(catchCode(() => guard.canActivate(context({})))).toBe(
      ErrorCode.NOT_FOUND,
    );
  });

  it("rejects a missing or wrong key", () => {
    const guard = build("secret");
    expect(catchCode(() => guard.canActivate(context({})))).toBe(
      ErrorCode.FORBIDDEN,
    );
    expect(
      catchCode(() => guard.canActivate(context({ "x-admin-key": "nope" }))),
    ).toBe(ErrorCode.FORBIDDEN);
  });

  it("accepts the configured key", () => {
    const guard = build("secret");
    expect(guard.canActivate(context({ "x-admin-key": "secret" }))).toBe(true);
  });
});

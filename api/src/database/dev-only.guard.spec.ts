import { ExecutionContext, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { DevOnlyGuard } from "./dev-only.guard";

const contextWithHeaders = (
  headers: Record<string, string | string[] | undefined> = {},
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

const buildGuard = (
  databaseResetEnabled: boolean,
  databaseToken: string | null = null,
): DevOnlyGuard => {
  const config = {
    get: () => ({ databaseResetEnabled, databaseToken }),
  } as unknown as ConfigService<AppConfig, true>;
  return new DevOnlyGuard(config);
};

describe("DevOnlyGuard", () => {
  it("allows an explicitly enabled development/test environment", () => {
    expect(buildGuard(true).canActivate(contextWithHeaders())).toBe(true);
  });

  it("hides the routes when the environment is not explicitly dev/test", () => {
    expect(() => buildGuard(false).canActivate(contextWithHeaders())).toThrow(
      NotFoundException,
    );
  });

  it("requires the shared token when one is configured", () => {
    const guard = buildGuard(true, "s3cret");
    expect(() => guard.canActivate(contextWithHeaders())).toThrow(
      NotFoundException,
    );
    expect(() =>
      guard.canActivate(contextWithHeaders({ "x-dev-database-token": "nope" })),
    ).toThrow(NotFoundException);
    expect(
      guard.canActivate(
        contextWithHeaders({ "x-dev-database-token": "s3cret" }),
      ),
    ).toBe(true);
  });
});

import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";

const build = () => {
  const config = {
    get: jest.fn(() => ({ accessSecret: "secret" })),
  };
  return new JwtStrategy(config as any);
};

describe("JwtStrategy", () => {
  it("returns the authenticated user for an access token", () => {
    const strategy = build();

    expect(
      strategy.validate({
        sub: "u1",
        email: "a@test.local",
        type: "access",
      }),
    ).toEqual({ id: "u1", email: "a@test.local" });
  });

  it("rejects a refresh token used as an access token", () => {
    const strategy = build();

    expect(() =>
      strategy.validate({
        sub: "u1",
        email: "a@test.local",
        type: "refresh",
      }),
    ).toThrow(UnauthorizedException);
  });
});

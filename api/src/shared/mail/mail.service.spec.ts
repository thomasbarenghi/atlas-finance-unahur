import { MailService } from "./mail.service";

const build = (mail: Record<string, unknown>) => {
  const config = { get: jest.fn(() => mail) };
  return new MailService(config as any);
};

describe("MailService", () => {
  it("logs the reset link in development (no SMTP)", async () => {
    const service = build({ host: null, user: null });
    await expect(
      service.sendPasswordReset("a@test.local", "tok"),
    ).resolves.toBeUndefined();
  });

  it("sends through SMTP when configured", async () => {
    const service = build({
      host: "smtp",
      user: "u",
      pass: "p",
      from: "f",
      port: 587,
    });
    await expect(
      service.sendPasswordReset("a@test.local", "tok"),
    ).resolves.toBeUndefined();
  });
});

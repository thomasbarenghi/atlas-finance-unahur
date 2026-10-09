import { ErrorCode } from "../../common/errors/error-codes";
import { CurrencyService } from "./currency.service";

const build = (supported: string[] = ["ARS", "USD", "EUR"]) => {
  const config = { get: jest.fn(() => supported) };
  return new CurrencyService(config as any);
};

describe("CurrencyService", () => {
  it("recognizes supported currencies case-insensitively", () => {
    const service = build();
    expect(service.isSupported("ars")).toBe(true);
    expect(service.isSupported("USD")).toBe(true);
    expect(service.isSupported("GBP")).toBe(false);
  });

  it("normalizes a supported currency to upper case", () => {
    const service = build();
    expect(service.assertSupported("usd")).toBe("USD");
  });

  it("rejects unsupported, empty and non-string currencies", () => {
    const service = build();
    for (const value of ["GBP", "", undefined, 123]) {
      expect(() => service.assertSupported(value as unknown as string)).toThrow(
        /no está soportada/,
      );
    }
    try {
      service.assertSupported("GBP");
    } catch (error) {
      expect(error).toMatchObject({
        response: {
          code: ErrorCode.VALIDATION_ERROR,
          fieldErrors: { currency: ["Moneda no soportada"] },
        },
      });
    }
  });
});

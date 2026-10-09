import { numericTransformer } from "./numeric.transformer";

describe("numericTransformer", () => {
  it("converts numeric strings to numbers on read", () => {
    expect(numericTransformer.from("123.45" as never)).toBe(123.45);
    expect(numericTransformer.from("0" as never)).toBe(0);
  });

  it("returns null for null/undefined on read", () => {
    expect(numericTransformer.from(null as never)).toBeNull();
    expect(numericTransformer.from(undefined as never)).toBeNull();
  });

  it("passes numbers through on write", () => {
    expect(numericTransformer.to(10 as never)).toBe(10);
    expect(numericTransformer.to(null as never)).toBeNull();
  });
});

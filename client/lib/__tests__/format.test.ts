import { describe, expect, it } from "vitest";
import {
  formatMoneyTyping,
  monthInputValue,
  monthStartFromInput,
  parseMoneyInput,
  sanitizeMoneyInput,
  toIsoDate,
  formatTimeAgo,
} from "@/lib/format";

describe("sanitizeMoneyInput", () => {
  it("keeps only digits, dots and commas", () => {
    expect(sanitizeMoneyInput("a1b2,3c4")).toBe("12,34");
    expect(sanitizeMoneyInput("$ 1.234,56")).toBe("1.234,56");
  });

  it("drops extra commas after the first", () => {
    expect(sanitizeMoneyInput("1,2,3")).toBe("1,23");
  });
});

describe("parseMoneyInput", () => {
  it("parses es-AR formatted values", () => {
    expect(parseMoneyInput("1.234,56")).toBe(1234.56);
    expect(parseMoneyInput("50")).toBe(50);
    expect(parseMoneyInput("1.000.000")).toBe(1000000);
  });

  it("treats more than two trailing decimals as thousands separators", () => {
    expect(parseMoneyInput("1234.567")).toBe(1234567);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput(".")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
  });
});

describe("formatMoneyTyping", () => {
  it("groups integer digits and preserves the decimal tail", () => {
    expect(formatMoneyTyping("1234567")).toBe("1.234.567");
    expect(formatMoneyTyping("1234,5")).toBe("1.234,5");
    expect(formatMoneyTyping("1234,")).toBe("1.234,");
    expect(formatMoneyTyping("")).toBe("");
  });
});

describe("date helpers", () => {
  it("builds an ISO date from a local Date without timezone drift", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("converts between month input value and month start", () => {
    expect(monthInputValue("2026-01-01")).toBe("2026-01");
    expect(monthStartFromInput("2026-01")).toBe("2026-01-01");
  });

  it("describes relative time in Spanish", () => {
    const reference = new Date("2026-01-20T12:00:00.000Z");
    expect(formatTimeAgo("2026-01-20T11:45:00.000Z", reference)).toBe(
      "hace menos de 1 h",
    );
    expect(formatTimeAgo("2026-01-20T10:00:00.000Z", reference)).toBe(
      "hace 2 h",
    );
    expect(formatTimeAgo("2026-01-18T12:00:00.000Z", reference)).toBe(
      "hace 2 d",
    );
  });
});

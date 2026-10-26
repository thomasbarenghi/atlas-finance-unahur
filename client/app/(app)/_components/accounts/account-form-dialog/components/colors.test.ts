import { describe, expect, it } from "vitest";
import { hexToRgba } from "./colors";

describe("hexToRgba", () => {
  it("expands 3-digit hex and falls back for invalid input", () => {
    expect(hexToRgba("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(hexToRgba("#ef4444", 0.15)).toBe("rgba(239, 68, 68, 0.15)");
    expect(hexToRgba("#zzz", 0.5)).toBe("rgba(100, 116, 139, 0.5)");
  });
});

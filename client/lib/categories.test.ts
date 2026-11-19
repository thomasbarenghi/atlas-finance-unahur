import { describe, expect, it } from "vitest";
import { sortCategories } from "@/lib/categories";
import { makeCategory } from "@/lib/test/factories";

describe("sortCategories", () => {
  it("sorts categories by name", () => {
    const categories = [
      makeCategory({ name: "Zeta" }),
      makeCategory({ name: "Alfa" }),
    ];
    expect(sortCategories(categories).map((category) => category.name)).toEqual(
      ["Alfa", "Zeta"],
    );
  });
});

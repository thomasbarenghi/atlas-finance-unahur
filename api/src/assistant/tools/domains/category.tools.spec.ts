import { CategoryTools } from "./category.tools";

const CAT = "00000000-0000-4000-8000-00000000000c";

const category = (overrides: Record<string, unknown> = {}) => ({
  id: CAT,
  name: "Mascotas",
  type: "expense",
  color: "#ef4444",
  isSystem: false,
  ...overrides,
});

const build = () => {
  const categories = {
    listCategories: jest.fn().mockResolvedValue([category()]),
    createCategory: jest.fn().mockResolvedValue(category()),
    updateCategory: jest.fn().mockResolvedValue(category({ name: "Editada" })),
    archiveCategory: jest.fn().mockResolvedValue(category({ archived: true })),
    assertCategoryUsable: jest.fn().mockResolvedValue(category()),
  };
  const resolver = { resolveCategoryId: jest.fn().mockResolvedValue(CAT) };
  const tools = new CategoryTools(categories as any, resolver as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, categories, resolver };
};

describe("CategoryTools", () => {
  it("lists categories", async () => {
    const { byName } = build();
    expect(
      (await byName("listCategories").execute!("u1", {})).summary,
    ).toContain("1");
  });

  it("creates a category", async () => {
    const { byName, categories } = build();
    const definition = byName("createCategory");
    const prepared = await definition.prepare!("u1", {
      name: "Mascotas",
      type: "expense",
      color: "#ef4444",
    });
    expect(prepared.args).toMatchObject({ name: "Mascotas" });
    await definition.execute!("u1", prepared.args);
    expect(categories.createCategory).toHaveBeenCalled();
  });

  it("updates a category and rejects empty changes", async () => {
    const { byName, categories } = build();
    const definition = byName("updateCategory");
    await definition.prepare!("u1", { categoryId: CAT, name: "Nueva" });
    await expect(
      definition.prepare!("u1", { categoryId: CAT }),
    ).rejects.toThrow(/ningún cambio/);
    await definition.execute!("u1", { categoryId: CAT, name: "Nueva" });
    expect(categories.updateCategory).toHaveBeenCalled();
  });

  it("archives a category", async () => {
    const { byName, categories } = build();
    await byName("archiveCategory").prepare!("u1", { categoryId: CAT });
    await byName("archiveCategory").execute!("u1", { categoryId: CAT });
    expect(categories.archiveCategory).toHaveBeenCalledWith("u1", CAT);
  });
});

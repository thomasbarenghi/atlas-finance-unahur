import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { CategoriesService } from "./categories.service";
import { Category } from "./entities/category.entity";

const category = (overrides: Partial<Category> = {}): Category =>
  ({
    id: "c1",
    userId: "u1",
    name: "Supermercado",
    type: "expense",
    color: "#ef4444",
    icon: null,
    ...overrides,
  }) as Category;

const build = () => {
  const repository = mockRepository();
  const service = new CategoriesService(repository as any);
  return { service, repository };
};

describe("CategoriesService", () => {
  it("lists system categories and the user's own", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      category({ id: "system", userId: null }),
      category({ id: "own" }),
    ]);

    const categories = await service.listCategories("u1");

    expect(categories).toHaveLength(2);
    expect(categories[0].isSystem).toBe(true);
    expect(categories[1].isSystem).toBe(false);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Array) }),
    );
  });

  it("creates a category owned by the user", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([]);

    const created = await service.createCategory("u1", {
      name: "  Mascotas  ",
      type: "expense",
      color: "#F97316",
    });

    expect(created).toMatchObject({
      name: "Mascotas",
      type: "expense",
      color: "#f97316",
      isSystem: false,
    });
  });

  it("rejects a duplicate name (including system categories)", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      category({ id: "system", userId: null, name: "Sueldo", type: "income" }),
    ]);

    await expect(
      service.createCategory("u1", {
        name: "sueldo",
        type: "income",
        color: "#22c55e",
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_ERROR },
    });
  });

  it("updates an owned category and keeps its type", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category());
    repository.find.mockResolvedValue([category()]);
    repository.save.mockImplementation(async (value: unknown) => value);

    const updated = await service.updateCategory("u1", "c1", {
      name: "Comida",
      color: "#111111",
    });

    expect(updated).toMatchObject({
      name: "Comida",
      color: "#111111",
      type: "expense",
    });
  });

  it("does not expose system categories for editing or deleting", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.updateCategory("u1", "system", { name: "X" }),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });
    await expect(service.deleteCategory("u1", "system")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("deletes an owned category", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category());

    await service.deleteCategory("u1", "c1");

    expect(repository.delete).toHaveBeenCalledWith({ id: "c1", userId: "u1" });
  });

  it("only assigns accessible categories with a matching type", async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(category());

    await expect(
      service.assertCategoryAssignable("u1", "c1", "expense"),
    ).resolves.toMatchObject({ id: "c1" });

    await expect(
      service.assertCategoryAssignable("u1", "c1", "income"),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("rejects another user's category", async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.assertCategoryAssignable("u1", "c1", "expense"),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });
  });
});

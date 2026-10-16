import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { Category } from "./entities/category.entity";
import { CategoriesService } from "./categories.service";

const category = (overrides: Partial<Category> = {}): Category =>
  ({
    id: "c1",
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
  it("lists the fixed category catalog", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([category()]);
    await expect(service.listCategories()).resolves.toHaveLength(1);
  });

  it("asserts a category exists", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category());
    await expect(service.assertCategoryExists("c1")).resolves.toMatchObject({
      id: "c1",
    });
  });

  it("rejects an unknown category", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.assertCategoryExists("nope")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});

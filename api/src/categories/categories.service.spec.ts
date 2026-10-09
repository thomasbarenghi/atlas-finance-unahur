import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { Category } from "./entities/category.entity";
import { CategoriesService } from "./categories.service";

const category = (overrides: Partial<Category> = {}): Category =>
  ({
    id: "c1",
    userId: "u1",
    name: "Comida",
    type: "expense",
    color: "#ef4444",
    icon: null,
    archived: false,
    ...overrides,
  }) as Category;

const build = () => {
  const repository = mockRepository();
  repository.create.mockImplementation((value: any) => category(value));
  repository.save.mockImplementation(async (value: any) => category(value));
  const service = new CategoriesService(repository as any);
  return { service, repository };
};

describe("CategoriesService", () => {
  it("lists user and system categories", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([category()]);
    await expect(service.listCategories("u1")).resolves.toHaveLength(1);
  });

  it("creates, updates and archives a category", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category());

    expect(
      (
        await service.createCategory("u1", {
          name: "X",
          type: "expense",
          color: "#fff",
        } as any)
      ).isSystem,
    ).toBe(false);
    expect(
      (
        await service.updateCategory("u1", "c1", {
          name: "Y",
          color: "#000",
        } as any)
      ).name,
    ).toBe("Y");
    expect((await service.archiveCategory("u1", "c1")).archived).toBe(true);
  });

  it("rejects editing a system category", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category({ userId: null }));
    await expect(
      service.updateCategory("u1", "c1", {} as any),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.FORBIDDEN },
    });
  });

  it("rejects an unknown or foreign category", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOwnedCategory("u1", "c1")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });

    repository.findOneBy.mockResolvedValue(category({ userId: "other" }));
    await expect(service.findOwnedCategory("u1", "c1")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("trims the icon on create and clears it on update", async () => {
    const { service, repository } = build();
    await service.createCategory("u1", {
      name: "X",
      type: "expense",
      color: "#fff",
      icon: "  star  ",
    } as any);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "star" }),
    );

    repository.findOneBy.mockResolvedValue(category());
    await service.updateCategory("u1", "c1", {
      icon: null,
      type: "income",
    } as any);
  });

  it("asserts a category is usable (own or system)", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(category());
    await expect(
      service.assertCategoryUsable("u1", "c1"),
    ).resolves.toMatchObject({
      id: "c1",
    });

    repository.findOneBy.mockResolvedValue(category({ userId: null }));
    await expect(
      service.assertCategoryUsable("u1", "c1"),
    ).resolves.toBeDefined();

    repository.findOneBy.mockResolvedValue(category({ userId: "other" }));
    await expect(
      service.assertCategoryUsable("u1", "c1"),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});

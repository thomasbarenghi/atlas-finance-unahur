/**
 * Shared unit-test doubles. Lives outside `src/` on purpose so it is not part of
 * the coverage scope; only test files import it.
 */
export type MockRepository = Record<string, any>;

export const mockRepository = (
  overrides: Record<string, jest.Mock> = {},
): MockRepository => {
  const manager = {
    save: jest.fn(async (entity: any) => entity),
    create: jest.fn((_entity: any, value: any) => value),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    upsert: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    getRepository: jest.fn(),
    transaction: jest.fn(),
  };
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findOneByOrFail: jest.fn().mockResolvedValue({}),
    save: jest.fn(async (entity: any) => entity),
    create: jest.fn((value: any) => value),
    insert: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn(async (entity: any) => entity),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({}),
    manager,
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
};

/** Chainable `createQueryBuilder` double returning `[items, total]`. */
export const mockQueryBuilder = (
  items: unknown[] = [],
  total = items.length,
): Record<string, jest.Mock> => {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    "select",
    "addSelect",
    "where",
    "andWhere",
    "orderBy",
    "addOrderBy",
    "skip",
    "take",
    "groupBy",
    "having",
  ]) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([items, total]);
  qb.getMany = jest.fn().mockResolvedValue(items);
  qb.getRawMany = jest.fn().mockResolvedValue(items);
  qb.getRawAndEntities = jest
    .fn()
    .mockResolvedValue({ raw: items, entities: items });
  return qb;
};

export const mockDataSource = (
  overrides: Record<string, any> = {},
): Record<string, any> => ({
  transaction: jest.fn(async (callback: (manager: any) => Promise<unknown>) =>
    callback(mockRepository().manager),
  ),
  getRepository: jest.fn(),
  ...overrides,
});

export const mockConfig = (
  values: Record<string, unknown> = {},
): { get: jest.Mock } => ({
  get: jest.fn((key: string) => values[key]),
});

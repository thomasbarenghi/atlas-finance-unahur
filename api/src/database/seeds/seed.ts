import { Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { DataSource, EntityManager } from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { Category } from "../../categories/entities/category.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { User } from "../../users/entities/user.entity";

const logger = new Logger("Seed");

/**
 * Deterministic demo accounts. Every user shares the same password so the whole
 * matrix is easy to remember; the e-mail is the identifier that selects which
 * scenario you land on.
 */
export const DEMO_EMAIL = "demo@atlassfin.app";
export const EMPTY_EMAIL = "sin-datos@atlassfin.app";
export const SECOND_EMAIL = "ana@atlassfin.app";
export const DEMO_PASSWORD = "Demo1234!";

interface CategorySeed {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
}

/**
 * Fixed category catalog defined by the system (FR-TRX-002, v0.3). Categories
 * can no longer be created, edited or deleted by users.
 */
const FIXED_CATEGORIES: CategorySeed[] = [
  { name: "Sueldo", type: "income", color: "#22c55e", icon: "wallet" },
  { name: "Freelance", type: "income", color: "#16a34a", icon: "briefcase" },
  {
    name: "Supermercado",
    type: "expense",
    color: "#ef4444",
    icon: "shopping-cart",
  },
  { name: "Transporte", type: "expense", color: "#3b82f6", icon: "bus" },
  { name: "Servicios", type: "expense", color: "#0ea5e9", icon: "receipt" },
];

const isoDate = (reference: Date, monthOffset: number, day: number): string =>
  new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth() + monthOffset,
      day,
    ),
  )
    .toISOString()
    .slice(0, 10);

const ensureCategories = async (manager: EntityManager): Promise<void> => {
  const repo = manager.getRepository(Category);
  const existing = await repo.find();
  const existingNames = new Set(existing.map((category) => category.name));
  const missing = FIXED_CATEGORIES.filter(
    (category) => !existingNames.has(category.name),
  );
  if (missing.length > 0) {
    await repo.save(missing.map((category) => repo.create(category)));
    logger.log(`Seeded ${missing.length} fixed categories`);
  }
};

const loadCategoryIds = async (
  manager: EntityManager,
): Promise<Map<string, string>> => {
  const categories = await manager.getRepository(Category).find();
  return new Map(categories.map((category) => [category.name, category.id]));
};

interface SeededUser {
  id: string;
  name: string;
}

const createUser = async (
  manager: EntityManager,
  passwordHash: string,
  data: { name: string; email: string },
): Promise<SeededUser> => {
  const repo = manager.getRepository(User);
  const user = await repo.save(repo.create({ ...data, passwordHash }));
  return { id: user.id, name: user.name };
};

/** Full, deterministic dataset for the `demo@atlassfin.app` account. */
const seedDemoDataset = async (
  manager: EntityManager,
  user: SeededUser,
  categoryIds: Map<string, string>,
  reference: Date,
): Promise<void> => {
  const categoryId = (name: string): string => {
    const id = categoryIds.get(name);
    if (!id) throw new Error(`Missing seed category: ${name}`);
    return id;
  };

  const accountRepo = manager.getRepository(Account);
  const [cash, bank, wallet] = await accountRepo.save([
    accountRepo.create({
      userId: user.id,
      name: "Caja",
      type: "cash",
      initialBalance: 50000,
      notes: "Efectivo en mano",
    }),
    accountRepo.create({
      userId: user.id,
      name: "Banco",
      type: "bank",
      initialBalance: 300000,
      notes: "Cuenta principal",
    }),
    accountRepo.create({
      userId: user.id,
      name: "Billetera virtual",
      type: "wallet",
      initialBalance: 15000,
      notes: null,
    }),
  ]);

  const transactionRepo = manager.getRepository(Transaction);
  const transactions: Transaction[] = [];
  const offsets = [-2, -1, 0];
  const supermarketAmounts = [108000, 115000, 120000];

  offsets.forEach((offset, index) => {
    const date = (day: number): string => isoDate(reference, offset, day);
    const transferGroupId = randomUUID();

    transactions.push(
      transactionRepo.create({
        userId: user.id,
        type: "income",
        amount: 900000,
        date: date(5),
        description: "Sueldo",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Sueldo"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: supermarketAmounts[index],
        date: date(10),
        description: "Supermercado",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Supermercado"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: 12000,
        date: date(12),
        description: "Transporte público",
        notes: null,
        accountId: cash.id,
        categoryId: categoryId("Transporte"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: 18000,
        date: date(9),
        description: "Internet y luz",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Servicios"),
      }),
      // Transfer: two atomic legs sharing `transferGroupId` (FR-TRX-005).
      transactionRepo.create({
        userId: user.id,
        type: "transfer",
        amount: -50000,
        date: date(15),
        description: "Ahorro mensual",
        notes: null,
        accountId: bank.id,
        transferAccountId: wallet.id,
        categoryId: null,
        transferGroupId,
      }),
      transactionRepo.create({
        userId: user.id,
        type: "transfer",
        amount: 50000,
        date: date(15),
        description: "Ahorro mensual",
        notes: null,
        accountId: wallet.id,
        transferAccountId: bank.id,
        categoryId: null,
        transferGroupId,
      }),
    );
  });

  transactions.push(
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 180000,
      date: isoDate(reference, 0, 22),
      description: "Trabajo freelance",
      notes: "Proyecto puntual",
      accountId: bank.id,
      categoryId: categoryId("Freelance"),
    }),
    // Un-categorized income, to exercise the nullable category path.
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 30000,
      date: isoDate(reference, -1, 27),
      description: "Venta de usados",
      notes: null,
      accountId: wallet.id,
      categoryId: null,
    }),
  );

  await transactionRepo.save(transactions);
};

export const runSeed = async (dataSource: DataSource): Promise<void> => {
  const reference = new Date();

  await dataSource.transaction(async (manager) => {
    await ensureCategories(manager);
    const categoryIds = await loadCategoryIds(manager);

    const userRepo = manager.getRepository(User);
    const existingDemo = await userRepo.findOne({
      where: { email: DEMO_EMAIL },
    });
    if (existingDemo) {
      logger.log(`Demo user ${DEMO_EMAIL} already exists — skipping seed`);
      return;
    }

    const passwordHash = await argon2.hash(DEMO_PASSWORD);

    const demo = await createUser(manager, passwordHash, {
      name: "Demo",
      email: DEMO_EMAIL,
    });
    await seedDemoDataset(manager, demo, categoryIds, reference);

    // Empty user: no financial data, to exercise empty states (FR-DAS-008).
    await createUser(manager, passwordHash, {
      name: "Sin Datos",
      email: EMPTY_EMAIL,
    });

    // Second user with a minimal dataset, to test ownership isolation.
    const second = await createUser(manager, passwordHash, {
      name: "Ana Probadora",
      email: SECOND_EMAIL,
    });
    const accountRepo = manager.getRepository(Account);
    const transactionRepo = manager.getRepository(Transaction);
    const [secondBank] = await accountRepo.save([
      accountRepo.create({
        userId: second.id,
        name: "Cuenta de Ana",
        type: "bank",
        initialBalance: 100000,
        notes: null,
      }),
    ]);
    await transactionRepo.save([
      transactionRepo.create({
        userId: second.id,
        type: "income",
        amount: 200000,
        date: isoDate(reference, 0, 3),
        description: "Sueldo",
        notes: null,
        accountId: secondBank.id,
        categoryId: categoryIds.get("Sueldo") ?? null,
      }),
    ]);

    logger.log(
      `Seeded demo data for ${DEMO_EMAIL}, ${EMPTY_EMAIL} and ${SECOND_EMAIL}`,
    );
  });
};

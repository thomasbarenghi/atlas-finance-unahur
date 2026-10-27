import { Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { DataSource, EntityManager, IsNull } from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { Category } from "../../categories/entities/category.entity";
import {
  ExchangeRatesProvider,
  type FetchedRates,
} from "../../currencies/exchange-rates.provider";
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
  const existing = await repo.find({ where: { userId: IsNull() } });
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
  const categories = await manager
    .getRepository(Category)
    .find({ where: { userId: IsNull() } });
  return new Map(categories.map((category) => [category.name, category.id]));
};

interface SeededUser {
  id: string;
  name: string;
}

const createUser = async (
  manager: EntityManager,
  passwordHash: string,
  data: { name: string; email: string; primaryCurrency?: string },
): Promise<SeededUser> => {
  const repo = manager.getRepository(User);
  const user = await repo.save(
    repo.create({
      ...data,
      primaryCurrency: data.primaryCurrency ?? "ARS",
      passwordHash,
    }),
  );
  return { id: user.id, name: user.name };
};

/** Full, deterministic dataset for the `demo@atlassfin.app` account. */
const seedDemoDataset = async (
  manager: EntityManager,
  user: SeededUser,
  categoryIds: Map<string, string>,
  reference: Date,
  rates: FetchedRates | null,
): Promise<void> => {
  const categoryId = (name: string): string => {
    const id = categoryIds.get(name);
    if (!id) throw new Error(`Missing seed category: ${name}`);
    return id;
  };

  // A user-owned category complements the fixed catalog and matches the demo
  // screen ("Reintegro · Otros"). It is scoped to the demo user.
  const categoryRepo = manager.getRepository(Category);
  const other = await categoryRepo.save(
    categoryRepo.create({
      userId: user.id,
      name: "Otros",
      type: "income",
      color: "#64748b",
      icon: "circle",
    }),
  );

  const accountRepo = manager.getRepository(Account);
  const [cash, bank, wallet, usdWallet] = await accountRepo.save([
    accountRepo.create({
      userId: user.id,
      name: "Caja",
      type: "cash",
      currency: "ARS",
      initialBalance: 50000,
      notes: "Efectivo en mano",
    }),
    accountRepo.create({
      userId: user.id,
      name: "Banco",
      type: "bank",
      currency: "ARS",
      initialBalance: 300000,
      notes: "Cuenta principal",
    }),
    accountRepo.create({
      userId: user.id,
      name: "Billetera virtual",
      type: "wallet",
      currency: "ARS",
      initialBalance: 15000,
      notes: null,
    }),
    accountRepo.create({
      userId: user.id,
      name: "Billetera USD",
      type: "wallet",
      currency: "USD",
      initialBalance: 500,
      notes: "Dólares",
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
      // Transfer: two legs sharing `transferGroupId`.
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

  // USD account movements (amounts live in the account's currency).
  transactions.push(
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 200,
      date: isoDate(reference, 0, 18),
      description: "Honorarios freelance",
      notes: null,
      accountId: usdWallet.id,
      categoryId: categoryId("Freelance"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 60,
      date: isoDate(reference, 0, 12),
      description: "Venta de usados",
      notes: null,
      accountId: usdWallet.id,
      categoryId: other.id,
    }),
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 60,
      date: isoDate(reference, 0, 2),
      description: "Reintegro",
      notes: null,
      accountId: usdWallet.id,
      categoryId: other.id,
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 40,
      date: isoDate(reference, 0, 8),
      description: "Suscripción Figma",
      notes: null,
      accountId: usdWallet.id,
      categoryId: categoryId("Servicios"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 60,
      date: isoDate(reference, 0, 5),
      description: "Servicios cloud",
      notes: null,
      accountId: usdWallet.id,
      categoryId: categoryId("Servicios"),
    }),
  );

  // Multi-currency transfer at the API quote: 100.000 ARS become USD.
  const usdRate = rates?.rates.USD;
  if (usdRate && usdRate > 0) {
    const conversionGroupId = randomUUID();
    const convertedAmount = Math.round((100000 / usdRate) * 10000) / 10000;
    transactions.push(
      transactionRepo.create({
        userId: user.id,
        type: "transfer",
        amount: -100000,
        date: isoDate(reference, 0, 15),
        description: "Compra de dólares",
        notes: null,
        accountId: bank.id,
        transferAccountId: usdWallet.id,
        categoryId: null,
        transferGroupId: conversionGroupId,
      }),
      transactionRepo.create({
        userId: user.id,
        type: "transfer",
        amount: convertedAmount,
        date: isoDate(reference, 0, 15),
        description: "Compra de dólares",
        notes: null,
        accountId: usdWallet.id,
        transferAccountId: bank.id,
        categoryId: null,
        transferGroupId: conversionGroupId,
      }),
    );
  }

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
  const rates = await new ExchangeRatesProvider().fetch();
  if (!rates) {
    logger.warn(
      "No se pudo obtener la cotización de la API; se omite la transferencia multimoneda del seed",
    );
  }

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
      primaryCurrency: "ARS",
    });
    await seedDemoDataset(manager, demo, categoryIds, reference, rates);

    // Empty user: no financial data, to exercise empty states.
    await createUser(manager, passwordHash, {
      name: "Sin Datos",
      email: EMPTY_EMAIL,
      primaryCurrency: "ARS",
    });

    // Second user with a minimal dataset, to test ownership isolation.
    const second = await createUser(manager, passwordHash, {
      name: "Ana Probadora",
      email: SECOND_EMAIL,
      primaryCurrency: "ARS",
    });
    const accountRepo = manager.getRepository(Account);
    const transactionRepo = manager.getRepository(Transaction);
    const [secondBank] = await accountRepo.save([
      accountRepo.create({
        userId: second.id,
        name: "Cuenta de Ana",
        type: "bank",
        currency: "ARS",
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

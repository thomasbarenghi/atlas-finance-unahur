import { Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { DataSource, EntityManager, IsNull } from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { AiConversation } from "../../assistant/entities/ai-conversation.entity";
import { Asset } from "../../assets/entities/asset.entity";
import { Valuation } from "../../assets/entities/valuation.entity";
import { Budget } from "../../budgets/entities/budget.entity";
import { Category } from "../../categories/entities/category.entity";
import { Debt } from "../../debts/entities/debt.entity";
import { ExchangeRate } from "../../fx/entities/exchange-rate.entity";
import { Goal } from "../../goals/entities/goal.entity";
import { Position } from "../../positions/entities/position.entity";
import { Quote } from "../../quotes/entities/quote.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { User } from "../../users/entities/user.entity";

const logger = new Logger("Seed");

const DEMO_NAME = "Demo";
const DEMO_EMAIL = "demo@atlassfin.app";
const DEMO_PASSWORD = "Demo1234!";

interface CategorySeed {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
}

const SYSTEM_CATEGORIES: CategorySeed[] = [
  { name: "salary", type: "income", color: "#22c55e", icon: null },
  { name: "freelance", type: "income", color: "#16a34a", icon: null },
  { name: "other_income", type: "income", color: "#4ade80", icon: null },
  { name: "food", type: "expense", color: "#ef4444", icon: null },
  { name: "transport", type: "expense", color: "#3b82f6", icon: null },
  { name: "housing", type: "expense", color: "#f59e0b", icon: null },
  { name: "services", type: "expense", color: "#0ea5e9", icon: null },
  { name: "entertainment", type: "expense", color: "#a855f7", icon: null },
  { name: "other_expense", type: "expense", color: "#64748b", icon: null },
];

const now = new Date();

const dayOfMonth = (offset: number, day: number): string =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, day))
    .toISOString()
    .slice(0, 10);

const firstDayOfMonth = (offset: number): string => dayOfMonth(offset, 1);

const ensureSystemCategories = async (
  manager: EntityManager,
): Promise<void> => {
  const repo = manager.getRepository(Category);
  const existing = await repo.find({ where: { userId: IsNull() } });
  const existingKeys = new Set(
    existing.map((category) => `${category.type}:${category.name}`),
  );
  const missing = SYSTEM_CATEGORIES.filter(
    (category) => !existingKeys.has(`${category.type}:${category.name}`),
  );
  if (missing.length > 0) {
    await repo.save(
      missing.map((category) => repo.create({ ...category, userId: null })),
    );
    logger.log(`Seeded ${missing.length} system categories`);
  }
};

const EXCHANGE_RATES = [
  { baseCurrency: "USD", quoteCurrency: "ARS", rate: 1000 },
  { baseCurrency: "EUR", quoteCurrency: "ARS", rate: 1100 },
  { baseCurrency: "BRL", quoteCurrency: "ARS", rate: 200 },
  { baseCurrency: "UYU", quoteCurrency: "ARS", rate: 25 },
];

const ensureExchangeRates = async (manager: EntityManager): Promise<void> => {
  const repo = manager.getRepository(ExchangeRate);
  const existing = await repo.find();
  const existingKeys = new Set(
    existing.map((rate) => `${rate.baseCurrency}:${rate.quoteCurrency}`),
  );
  const missing = EXCHANGE_RATES.filter(
    (rate) => !existingKeys.has(`${rate.baseCurrency}:${rate.quoteCurrency}`),
  );
  if (missing.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    await repo.save(
      missing.map((rate) =>
        repo.create({ ...rate, provider: "seed", date: today }),
      ),
    );
    logger.log(`Seeded ${missing.length} exchange rates`);
  }
};

export const runSeed = async (dataSource: DataSource): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    await ensureSystemCategories(manager);
    await ensureExchangeRates(manager);

    const userRepo = manager.getRepository(User);
    const existingUser = await userRepo.findOne({
      where: { email: DEMO_EMAIL },
    });
    if (existingUser) {
      logger.log(`Demo user ${DEMO_EMAIL} already exists — skipping seed`);
      return;
    }

    const passwordHash = await argon2.hash(DEMO_PASSWORD);
    const user = await userRepo.save(
      userRepo.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash,
        baseCurrency: "ARS",
        theme: "system",
        aiEnabled: true,
      }),
    );

    const accountRepo = manager.getRepository(Account);
    const [cash, bank] = await accountRepo.save([
      accountRepo.create({
        userId: user.id,
        name: "Caja ARS",
        type: "cash",
        currency: "ARS",
        initialBalance: 50000,
        notes: null,
      }),
      accountRepo.create({
        userId: user.id,
        name: "Banco ARS",
        type: "bank",
        currency: "ARS",
        initialBalance: 300000,
        notes: null,
      }),
      accountRepo.create({
        userId: user.id,
        name: "Ahorro USD",
        type: "wallet",
        currency: "USD",
        initialBalance: 1000,
        notes: null,
      }),
    ]);

    const categoryRepo = manager.getRepository(Category);
    const [salary, food, transport, entertainment, housing] =
      await categoryRepo.save([
        categoryRepo.create({
          userId: user.id,
          name: "Sueldo",
          type: "income",
          color: "#22c55e",
          icon: null,
        }),
        categoryRepo.create({
          userId: user.id,
          name: "Comida",
          type: "expense",
          color: "#ef4444",
          icon: null,
        }),
        categoryRepo.create({
          userId: user.id,
          name: "Transporte",
          type: "expense",
          color: "#3b82f6",
          icon: null,
        }),
        categoryRepo.create({
          userId: user.id,
          name: "Ocio",
          type: "expense",
          color: "#a855f7",
          icon: null,
        }),
        categoryRepo.create({
          userId: user.id,
          name: "Vivienda",
          type: "expense",
          color: "#f59e0b",
          icon: null,
        }),
      ]);

    const transactionRepo = manager.getRepository(Transaction);
    const transactions: Transaction[] = [];
    for (const offset of [-2, -1, 0]) {
      transactions.push(
        transactionRepo.create({
          userId: user.id,
          type: "income",
          amount: 900000,
          currency: "ARS",
          date: dayOfMonth(offset, 5),
          description: "Sueldo",
          notes: null,
          accountId: bank.id,
          categoryId: salary.id,
        }),
        transactionRepo.create({
          userId: user.id,
          type: "expense",
          amount: 90000,
          currency: "ARS",
          date: dayOfMonth(offset, 3),
          description: "Alquiler",
          notes: null,
          accountId: bank.id,
          categoryId: housing.id,
        }),
        transactionRepo.create({
          userId: user.id,
          type: "expense",
          amount: 35000,
          currency: "ARS",
          date: dayOfMonth(offset, 10),
          description: "Supermercado",
          notes: null,
          accountId: cash.id,
          categoryId: food.id,
        }),
        transactionRepo.create({
          userId: user.id,
          type: "expense",
          amount: 12000,
          currency: "ARS",
          date: dayOfMonth(offset, 12),
          description: "Transporte",
          notes: null,
          accountId: cash.id,
          categoryId: transport.id,
        }),
        transactionRepo.create({
          userId: user.id,
          type: "expense",
          amount: 20000,
          currency: "ARS",
          date: dayOfMonth(offset, 18),
          description: "Salidas",
          notes: null,
          accountId: bank.id,
          categoryId: entertainment.id,
        }),
      );

      const transferGroupId = randomUUID();
      transactions.push(
        transactionRepo.create({
          userId: user.id,
          type: "transfer",
          amount: -50000,
          currency: "ARS",
          date: dayOfMonth(offset, 15),
          description: "Ahorro mensual",
          notes: null,
          accountId: bank.id,
          transferAccountId: cash.id,
          categoryId: null,
          transferGroupId,
        }),
        transactionRepo.create({
          userId: user.id,
          type: "transfer",
          amount: 50000,
          currency: "ARS",
          date: dayOfMonth(offset, 15),
          description: "Ahorro mensual",
          notes: null,
          accountId: cash.id,
          transferAccountId: bank.id,
          categoryId: null,
          transferGroupId,
        }),
      );
    }
    await transactionRepo.save(transactions);

    const budgetRepo = manager.getRepository(Budget);
    const period = firstDayOfMonth(0);
    await budgetRepo.save([
      budgetRepo.create({
        userId: user.id,
        categoryId: housing.id,
        period,
        limit: 150000,
        currency: "ARS",
      }),
      budgetRepo.create({
        userId: user.id,
        categoryId: food.id,
        period,
        limit: 80000,
        currency: "ARS",
      }),
      budgetRepo.create({
        userId: user.id,
        categoryId: transport.id,
        period,
        limit: 30000,
        currency: "ARS",
      }),
      budgetRepo.create({
        userId: user.id,
        categoryId: entertainment.id,
        period,
        limit: 40000,
        currency: "ARS",
      }),
    ]);

    const assetRepo = manager.getRepository(Asset);
    const property = await assetRepo.save(
      assetRepo.create({
        userId: user.id,
        name: "Departamento",
        type: "property",
        currency: "ARS",
        notes: null,
      }),
    );
    const vehicle = await assetRepo.save(
      assetRepo.create({
        userId: user.id,
        name: "Auto",
        type: "vehicle",
        currency: "ARS",
        notes: null,
      }),
    );

    const valuationRepo = manager.getRepository(Valuation);
    await valuationRepo.save([
      valuationRepo.create({
        assetId: property.id,
        value: 85000000,
        currency: "ARS",
        date: firstDayOfMonth(-2),
        source: "manual",
      }),
      valuationRepo.create({
        assetId: property.id,
        value: 88000000,
        currency: "ARS",
        date: firstDayOfMonth(-1),
        source: "manual",
      }),
      valuationRepo.create({
        assetId: property.id,
        value: 90000000,
        currency: "ARS",
        date: firstDayOfMonth(0),
        source: "manual",
      }),
      valuationRepo.create({
        assetId: vehicle.id,
        value: 12000000,
        currency: "ARS",
        date: firstDayOfMonth(0),
        source: "manual",
      }),
    ]);

    const debtRepo = manager.getRepository(Debt);
    await debtRepo.save(
      debtRepo.create({
        userId: user.id,
        name: "Hipoteca",
        type: "mortgage",
        balance: 45000000,
        currency: "ARS",
        date: firstDayOfMonth(0),
        assetId: property.id,
      }),
    );

    const positionRepo = manager.getRepository(Position);
    await positionRepo.save([
      positionRepo.create({
        userId: user.id,
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 0.05,
        avgCost: 55000,
        currency: "USD",
      }),
      positionRepo.create({
        userId: user.id,
        symbol: "ETH",
        instrument: "Ethereum",
        quantity: 0.8,
        avgCost: 2500,
        currency: "USD",
      }),
    ]);

    const quoteRepo = manager.getRepository(Quote);
    await quoteRepo.save([
      quoteRepo.create({
        symbol: "BTC",
        price: 64000,
        currency: "USD",
        provider: "seed",
        change24h: 1.8,
        fetchedAt: now,
      }),
      quoteRepo.create({
        symbol: "ETH",
        price: 3100,
        currency: "USD",
        provider: "seed",
        change24h: -0.5,
        fetchedAt: now,
      }),
    ]);

    const goalRepo = manager.getRepository(Goal);
    await goalRepo.save([
      goalRepo.create({
        userId: user.id,
        name: "Vacaciones",
        targetAmount: 500000,
        savedAmount: 120000,
        currency: "ARS",
        targetDate: firstDayOfMonth(6),
        sourceAccountId: bank.id,
      }),
      goalRepo.create({
        userId: user.id,
        name: "Fondo de emergencia",
        targetAmount: 1000,
        savedAmount: 1000,
        currency: "USD",
        targetDate: null,
      }),
    ]);

    const conversationRepo = manager.getRepository(AiConversation);
    const periodMeta = {
      from: firstDayOfMonth(0),
      to: dayOfMonth(0, 28),
    };
    await conversationRepo.save([
      conversationRepo.create({
        userId: user.id,
        question: "¿En qué gasté más este mes?",
        answer:
          "Este mes tu mayor gasto fue en Vivienda, con 90.000 ARS registrados.",
        contextMeta: {
          period: periodMeta,
          currency: "ARS",
          sources: ["transactions", "categories"],
        },
      }),
      conversationRepo.create({
        userId: user.id,
        question: "¿Cómo evolucionó mi patrimonio?",
        answer:
          "Tu patrimonio neto se mantuvo estable, impulsado por la valuación del Departamento.",
        contextMeta: {
          period: periodMeta,
          currency: "ARS",
          sources: ["assets", "valuations", "debts"],
        },
      }),
    ]);

    logger.log(`Seeded demo data for ${DEMO_EMAIL}`);
  });
};

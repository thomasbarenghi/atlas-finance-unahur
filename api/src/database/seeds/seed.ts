import { Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { DataSource, EntityManager, IsNull } from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { AiConversation } from "../../assistant/entities/ai-conversation.entity";
import { AssistantAction } from "../../assistant/entities/assistant-action.entity";
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
  archived?: boolean;
}

/** Global reference categories (`user_id = NULL`), shared by all users. */
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

const EXCHANGE_RATES = [
  { baseCurrency: "USD", quoteCurrency: "ARS", rate: 1000 },
  { baseCurrency: "EUR", quoteCurrency: "ARS", rate: 1100 },
  { baseCurrency: "BRL", quoteCurrency: "ARS", rate: 200 },
  { baseCurrency: "UYU", quoteCurrency: "ARS", rate: 25 },
];

const QUOTES = [
  { symbol: "BTC", price: 64000, change24h: 1.8 },
  { symbol: "ETH", price: 3100, change24h: -0.5 },
  { symbol: "SOL", price: 150, change24h: 3.2 },
  { symbol: "BNB", price: 580, change24h: 0.4 },
  { symbol: "USDT", price: 1, change24h: 0.01 },
  { symbol: "USDC", price: 1, change24h: -0.01 },
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

const monthStart = (reference: Date, monthOffset: number): string =>
  isoDate(reference, monthOffset, 1);

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

const ensureExchangeRates = async (
  manager: EntityManager,
  reference: Date,
): Promise<void> => {
  const repo = manager.getRepository(ExchangeRate);
  const existing = await repo.find();
  const existingKeys = new Set(
    existing.map((rate) => `${rate.baseCurrency}:${rate.quoteCurrency}`),
  );
  const missing = EXCHANGE_RATES.filter(
    (rate) => !existingKeys.has(`${rate.baseCurrency}:${rate.quoteCurrency}`),
  );
  if (missing.length > 0) {
    const date = reference.toISOString().slice(0, 10);
    await repo.save(
      missing.map((rate) => repo.create({ ...rate, provider: "seed", date })),
    );
    logger.log(`Seeded ${missing.length} exchange rates`);
  }
};

interface SeededUser {
  id: string;
  name: string;
}

const createUser = async (
  manager: EntityManager,
  passwordHash: string,
  data: {
    name: string;
    email: string;
    baseCurrency: string;
    theme: "light" | "dark" | "system";
    aiEnabled: boolean;
    assistantDestructiveEnabled: boolean;
  },
): Promise<SeededUser> => {
  const repo = manager.getRepository(User);
  const user = await repo.save(repo.create({ ...data, passwordHash }));
  return { id: user.id, name: user.name };
};

const createCategories = async (
  manager: EntityManager,
  userId: string,
  categories: CategorySeed[],
): Promise<Map<string, Category>> => {
  const repo = manager.getRepository(Category);
  const saved = await repo.save(
    categories.map((category) =>
      repo.create({
        userId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        archived: category.archived ?? false,
      }),
    ),
  );
  return new Map(saved.map((category) => [category.name, category]));
};

/** Full, deterministic dataset for the `demo@atlassfin.app` account. */
const seedDemoDataset = async (
  manager: EntityManager,
  user: SeededUser,
  reference: Date,
): Promise<void> => {
  const categories = await createCategories(manager, user.id, [
    { name: "Sueldo", type: "income", color: "#22c55e", icon: null },
    { name: "Freelance", type: "income", color: "#16a34a", icon: null },
    { name: "Supermercado", type: "expense", color: "#ef4444", icon: null },
    { name: "Transporte", type: "expense", color: "#3b82f6", icon: null },
    { name: "Alquiler", type: "expense", color: "#f59e0b", icon: null },
    { name: "Servicios", type: "expense", color: "#0ea5e9", icon: null },
    { name: "Ocio", type: "expense", color: "#a855f7", icon: null },
    { name: "Salud", type: "expense", color: "#ec4899", icon: null },
    { name: "Educación", type: "expense", color: "#8b5cf6", icon: null },
    { name: "Compras", type: "expense", color: "#f97316", icon: null },
    { name: "Suscripciones", type: "expense", color: "#6366f1", icon: null },
    {
      name: "Categoría archivada",
      type: "expense",
      color: "#64748b",
      icon: null,
      archived: true,
    },
  ]);

  const accountRepo = manager.getRepository(Account);
  const [cash, bank, savingsUsd, card, wallet, oldAccount] =
    await accountRepo.save([
      accountRepo.create({
        userId: user.id,
        name: "Caja ARS",
        type: "cash",
        currency: "ARS",
        initialBalance: 50000,
        notes: "Efectivo en mano",
      }),
      accountRepo.create({
        userId: user.id,
        name: "Banco ARS",
        type: "bank",
        currency: "ARS",
        initialBalance: 300000,
        notes: "Cuenta principal",
      }),
      accountRepo.create({
        userId: user.id,
        name: "Ahorro USD",
        type: "wallet",
        currency: "USD",
        initialBalance: 1000,
        notes: null,
      }),
      accountRepo.create({
        userId: user.id,
        name: "Tarjeta Visa",
        type: "card",
        currency: "ARS",
        initialBalance: 0,
        notes: "Consumos en un pago",
      }),
      accountRepo.create({
        userId: user.id,
        name: "Billetera Virtual",
        type: "other",
        currency: "ARS",
        initialBalance: 15000,
        notes: null,
      }),
      accountRepo.create({
        userId: user.id,
        name: "Cuenta vieja (archivada)",
        type: "bank",
        currency: "ARS",
        initialBalance: 1000,
        archived: true,
        notes: "Se conserva como historial (FR-CUE-005)",
      }),
    ]);

  const transactionRepo = manager.getRepository(Transaction);
  const categoryId = (name: string): string => {
    const category = categories.get(name);
    if (!category) throw new Error(`Missing seed category: ${name}`);
    return category.id;
  };

  const transactions: Transaction[] = [];
  const offsets = [-3, -2, -1, 0];
  const supermarketAmounts = [92000, 108000, 115000, 120000];
  const entertainmentAmounts = [18000, 22000, 20000, 20000];

  offsets.forEach((offset, index) => {
    const date = (day: number): string => isoDate(reference, offset, day);
    // Both transfer legs share `transferGroupId` (FR-TRX-005).
    const transferGroupId = randomUUID();

    transactions.push(
      transactionRepo.create({
        userId: user.id,
        type: "income",
        amount: 900000,
        currency: "ARS",
        date: date(5),
        description: "Sueldo",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Sueldo"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: 90000,
        currency: "ARS",
        date: date(3),
        description: "Alquiler",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Alquiler"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: supermarketAmounts[index],
        currency: "ARS",
        date: date(10),
        description: "Supermercado",
        notes: index === 3 ? "Compra grande del mes" : null,
        accountId: bank.id,
        categoryId: categoryId("Supermercado"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: 12000,
        currency: "ARS",
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
        currency: "ARS",
        date: date(9),
        description: "Internet y luz",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Servicios"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "expense",
        amount: entertainmentAmounts[index],
        currency: "ARS",
        date: date(18),
        description: "Salidas",
        notes: null,
        accountId: bank.id,
        categoryId: categoryId("Ocio"),
      }),
      transactionRepo.create({
        userId: user.id,
        type: "transfer",
        amount: -50000,
        currency: "ARS",
        date: date(15),
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
        date: date(15),
        description: "Ahorro mensual",
        notes: null,
        accountId: cash.id,
        transferAccountId: bank.id,
        categoryId: null,
        transferGroupId,
      }),
    );
  });

  // One-off and edge-case movements.
  transactions.push(
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 150000,
      currency: "ARS",
      date: isoDate(reference, -1, 22),
      description: "Trabajo freelance",
      notes: "Proyecto puntual",
      accountId: bank.id,
      categoryId: categoryId("Freelance"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 180000,
      currency: "ARS",
      date: isoDate(reference, 0, 22),
      description: "Trabajo freelance",
      notes: null,
      accountId: bank.id,
      categoryId: categoryId("Freelance"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 15000,
      currency: "ARS",
      date: isoDate(reference, 0, 20),
      description: "Farmacia",
      notes: null,
      accountId: cash.id,
      categoryId: categoryId("Salud"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 25000,
      currency: "ARS",
      date: isoDate(reference, 0, 22),
      description: "Ropa",
      notes: null,
      accountId: card.id,
      categoryId: categoryId("Compras"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 12000,
      currency: "ARS",
      date: isoDate(reference, -1, 19),
      description: "Curso online",
      notes: null,
      accountId: card.id,
      categoryId: categoryId("Educación"),
    }),
    // Multi-currency example: USD expense converted with the seeded FX rate.
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 12.99,
      currency: "USD",
      date: isoDate(reference, 0, 6),
      description: "Suscripción streaming",
      notes: "Se cobra en dólares",
      accountId: savingsUsd.id,
      categoryId: categoryId("Suscripciones"),
    }),
    // Historical movement on an account that is now archived (FR-CUE-005).
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 5000,
      currency: "ARS",
      date: isoDate(reference, -3, 8),
      description: "Gasto histórico",
      notes: "De la cuenta que luego se archivó",
      accountId: oldAccount.id,
      categoryId: categoryId("Compras"),
    }),
    // Un-categorized historical income, to exercise the nullable category path.
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 30000,
      currency: "ARS",
      date: isoDate(reference, -2, 27),
      description: "Venta de usados",
      notes: null,
      accountId: wallet.id,
      categoryId: null,
    }),
  );

  await transactionRepo.save(transactions);

  const budgetRepo = manager.getRepository(Budget);
  await budgetRepo.save([
    // Exceeded (FRD Caso 1).
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Supermercado"),
      period: monthStart(reference, 0),
      limit: 100000,
      currency: "ARS",
      recurring: false,
    }),
    // Warning.
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Alquiler"),
      period: monthStart(reference, 0),
      limit: 100000,
      currency: "ARS",
      recurring: false,
    }),
    // Available.
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Transporte"),
      period: monthStart(reference, 0),
      limit: 50000,
      currency: "ARS",
      recurring: false,
    }),
    // Recurring template: projects into the current month (FR-PRE-007).
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Ocio"),
      period: monthStart(reference, -1),
      limit: 40000,
      currency: "ARS",
      recurring: true,
    }),
    // Previous-month history for the reports.
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Supermercado"),
      period: monthStart(reference, -1),
      limit: 100000,
      currency: "ARS",
      recurring: false,
    }),
  ]);

  const assetRepo = manager.getRepository(Asset);
  const [property, vehicle, investment, cashAsset, artwork] =
    await assetRepo.save([
      assetRepo.create({
        userId: user.id,
        name: "Departamento",
        type: "property",
        currency: "ARS",
        notes: "Vivienda familiar",
      }),
      assetRepo.create({
        userId: user.id,
        name: "Auto",
        type: "vehicle",
        currency: "ARS",
        notes: null,
      }),
      assetRepo.create({
        userId: user.id,
        name: "Plazo fijo",
        type: "investment",
        currency: "ARS",
        notes: "Renovación automática",
      }),
      assetRepo.create({
        userId: user.id,
        name: "Efectivo guardado",
        type: "cash",
        currency: "ARS",
        notes: null,
      }),
      assetRepo.create({
        userId: user.id,
        name: "Obra de arte",
        type: "other",
        currency: "ARS",
        notes: null,
      }),
      assetRepo.create({
        userId: user.id,
        name: "Activo archivado",
        type: "other",
        currency: "ARS",
        archived: true,
        notes: null,
      }),
    ]);

  const valuationRepo = manager.getRepository(Valuation);
  const valuationData: Array<Partial<Valuation>> = [];
  [85000000, 87000000, 88000000, 90000000].forEach((value, index) => {
    valuationData.push({
      assetId: property.id,
      value,
      currency: "ARS",
      date: monthStart(reference, index - 3),
      source: "manual",
    });
  });
  valuationData.push(
    {
      assetId: vehicle.id,
      value: 13000000,
      currency: "ARS",
      date: monthStart(reference, -2),
      source: "manual",
    },
    {
      assetId: vehicle.id,
      value: 12000000,
      currency: "ARS",
      date: monthStart(reference, 0),
      source: "manual",
    },
    {
      assetId: investment.id,
      value: 5000000,
      currency: "ARS",
      date: monthStart(reference, 0),
      source: "manual",
    },
    {
      assetId: cashAsset.id,
      value: 200000,
      currency: "ARS",
      date: monthStart(reference, 0),
      source: "manual",
    },
    {
      assetId: artwork.id,
      value: 800000,
      currency: "ARS",
      date: monthStart(reference, 0),
      source: "manual",
    },
  );
  await valuationRepo.save(
    valuationData.map((data) => valuationRepo.create(data)),
  );

  const debtRepo = manager.getRepository(Debt);
  await debtRepo.save([
    debtRepo.create({
      userId: user.id,
      name: "Hipoteca",
      type: "mortgage",
      balance: 45000000,
      currency: "ARS",
      date: monthStart(reference, 0),
      assetId: property.id,
    }),
    debtRepo.create({
      userId: user.id,
      name: "Préstamo personal",
      type: "loan",
      balance: 1200000,
      currency: "ARS",
      date: monthStart(reference, -2),
      assetId: null,
    }),
    debtRepo.create({
      userId: user.id,
      name: "Tarjeta Visa",
      type: "card",
      balance: 150000,
      currency: "ARS",
      date: monthStart(reference, 0),
      assetId: null,
    }),
    debtRepo.create({
      userId: user.id,
      name: "Préstamo en dólares",
      type: "loan",
      balance: 2000,
      currency: "USD",
      date: monthStart(reference, -1),
      assetId: null,
    }),
    debtRepo.create({
      userId: user.id,
      name: "Deuda saldada (archivada)",
      type: "other",
      balance: 0,
      currency: "ARS",
      date: monthStart(reference, -3),
      archived: true,
      assetId: null,
    }),
  ]);

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
    positionRepo.create({
      userId: user.id,
      symbol: "SOL",
      instrument: "Solana",
      quantity: 10,
      avgCost: 120,
      currency: "USD",
    }),
    positionRepo.create({
      userId: user.id,
      symbol: "BNB",
      instrument: "BNB (archivada)",
      quantity: 0.5,
      avgCost: 600,
      currency: "USD",
      archived: true,
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
      targetDate: monthStart(reference, 6),
      sourceAccountId: cash.id,
    }),
    goalRepo.create({
      userId: user.id,
      name: "Fondo de emergencia",
      targetAmount: 1000,
      savedAmount: 1000,
      currency: "USD",
      targetDate: null,
      sourceAccountId: savingsUsd.id,
    }),
    goalRepo.create({
      userId: user.id,
      name: "Notebook nueva (vencida)",
      targetAmount: 800000,
      savedAmount: 100000,
      currency: "ARS",
      targetDate: monthStart(reference, -1),
      sourceAccountId: bank.id,
    }),
    goalRepo.create({
      userId: user.id,
      name: "Auto nuevo",
      targetAmount: 2000000,
      savedAmount: 0,
      currency: "ARS",
      targetDate: monthStart(reference, 12),
      sourceAccountId: bank.id,
    }),
    goalRepo.create({
      userId: user.id,
      name: "Sin fecha objetivo",
      targetAmount: 300000,
      savedAmount: 50000,
      currency: "ARS",
      targetDate: null,
      sourceAccountId: wallet.id,
    }),
    goalRepo.create({
      userId: user.id,
      name: "Meta archivada",
      targetAmount: 100000,
      savedAmount: 100000,
      currency: "ARS",
      targetDate: null,
      sourceAccountId: null,
      archived: true,
    }),
  ]);

  const conversationRepo = manager.getRepository(AiConversation);
  const periodMeta = {
    from: monthStart(reference, 0),
    to: isoDate(reference, 0, 28),
  };
  const demoConversations = await conversationRepo.save([
    conversationRepo.create({
      userId: user.id,
      question: "¿En qué gasté más este mes?",
      answer:
        "Este mes tu mayor gasto fue en Supermercado, con 120.000 ARS registrados.",
      contextMeta: {
        period: periodMeta,
        currency: "ARS",
        sources: ["transactions", "categories"],
      },
      messages: [
        { role: "user", content: "¿En qué gasté más este mes?" },
        {
          role: "assistant",
          content: "Tu mayor gasto del mes fue en Supermercado (120.000 ARS).",
        },
      ],
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
      messages: [
        { role: "user", content: "¿Cómo evolucionó mi patrimonio?" },
        {
          role: "assistant",
          content:
            "El patrimonio se sostuvo por la revaluación del Departamento.",
        },
      ],
    }),
    conversationRepo.create({
      userId: user.id,
      question: "¿Cómo vengo con el presupuesto de supermercado?",
      answer:
        "El presupuesto de Supermercado está excedido: gastaste más que el límite del mes.",
      contextMeta: {
        period: periodMeta,
        currency: "ARS",
        sources: ["budgets", "transactions", "categories"],
      },
      messages: [
        {
          role: "user",
          content: "¿Cómo vengo con el presupuesto de supermercado?",
        },
        {
          role: "assistant",
          content: "Está excedido: superaste el límite mensual.",
        },
      ],
    }),
    conversationRepo.create({
      userId: user.id,
      question: "¿Cuánto gasté en enero de 2020?",
      answer:
        "No tengo información suficiente para enero de 2020: no hay movimientos en ese período.",
      contextMeta: {
        period: { from: "2020-01-01", to: "2020-01-31" },
        currency: "ARS",
        sources: ["transactions"],
      },
      messages: [
        { role: "user", content: "¿Cuánto gasté en enero de 2020?" },
        {
          role: "assistant",
          content: "No hay datos cargados para ese período.",
        },
      ],
    }),
  ]);

  const actionRepo = manager.getRepository(AssistantAction);
  const conversationId = demoConversations[0]?.id ?? null;
  const now = reference;
  const past = new Date(now.getTime() - 60 * 60 * 1000);
  const future = new Date(now.getTime() + 2 * 60 * 1000);
  await actionRepo.save([
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: null,
      step: 0,
      resolved: true,
      toolName: "getDashboard",
      classification: "read",
      args: { from: periodMeta.from, to: periodMeta.to },
      preview: null,
      status: "executed",
      tokenHash: null,
      result: { netWorth: 92000000 },
      errorMessage: null,
      expiresAt: past,
    }),
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: randomUUID(),
      step: 0,
      resolved: true,
      toolName: "createTransaction",
      classification: "write_safe",
      args: {
        type: "expense",
        amount: 5000,
        currency: "ARS",
        accountId: cash.id,
        categoryId: categoryId("Salud"),
      },
      preview: {
        title: "Registrar gasto",
        summary: "Gasto de 5.000 ARS en Salud desde Caja ARS",
        fields: [
          { label: "Monto", value: "5.000 ARS" },
          { label: "Categoría", value: "Salud" },
        ],
      },
      status: "proposed",
      tokenHash: randomUUID().replace(/-/g, ""),
      result: null,
      errorMessage: null,
      expiresAt: future,
    }),
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: null,
      step: 0,
      resolved: true,
      toolName: "createGoal",
      classification: "write_safe",
      args: { name: "Viaje", targetAmount: 200000 },
      preview: null,
      status: "executed",
      tokenHash: null,
      result: { id: randomUUID(), name: "Viaje" },
      errorMessage: null,
      expiresAt: past,
    }),
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: null,
      step: 0,
      resolved: true,
      toolName: "deleteTransaction",
      classification: "destructive",
      args: { id: randomUUID() },
      preview: null,
      status: "cancelled",
      tokenHash: randomUUID().replace(/-/g, ""),
      result: null,
      errorMessage: null,
      expiresAt: past,
    }),
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: null,
      step: 0,
      resolved: true,
      toolName: "updateBudget",
      classification: "sensitive",
      args: { limit: 120000 },
      preview: null,
      status: "expired",
      tokenHash: randomUUID().replace(/-/g, ""),
      result: null,
      errorMessage: null,
      expiresAt: past,
    }),
    actionRepo.create({
      userId: user.id,
      conversationId,
      planId: null,
      step: 0,
      resolved: false,
      toolName: "createValuation",
      classification: "write_safe",
      args: { assetName: "Departamento", value: 91000000 },
      preview: null,
      status: "failed",
      tokenHash: null,
      result: null,
      errorMessage: "El activo indicado no existe",
      expiresAt: past,
    }),
  ]);
};

/** Smaller USD dataset for the second user, used to test isolation/ownership. */
const seedSecondUserDataset = async (
  manager: EntityManager,
  user: SeededUser,
  reference: Date,
): Promise<void> => {
  const categories = await createCategories(manager, user.id, [
    { name: "Salario", type: "income", color: "#22c55e", icon: null },
    { name: "Comida", type: "expense", color: "#ef4444", icon: null },
    { name: "Alquiler", type: "expense", color: "#f59e0b", icon: null },
  ]);

  const categoryId = (name: string): string => {
    const category = categories.get(name);
    if (!category) throw new Error(`Missing seed category: ${name}`);
    return category.id;
  };

  const accountRepo = manager.getRepository(Account);
  const [bank] = await accountRepo.save([
    accountRepo.create({
      userId: user.id,
      name: "Cuenta USD",
      type: "bank",
      currency: "USD",
      initialBalance: 5000,
      notes: null,
    }),
    accountRepo.create({
      userId: user.id,
      name: "Efectivo USD",
      type: "cash",
      currency: "USD",
      initialBalance: 500,
      notes: null,
    }),
  ]);

  const transactionRepo = manager.getRepository(Transaction);
  await transactionRepo.save([
    transactionRepo.create({
      userId: user.id,
      type: "income",
      amount: 4500,
      currency: "USD",
      date: isoDate(reference, 0, 5),
      description: "Salario",
      notes: null,
      accountId: bank.id,
      categoryId: categoryId("Salario"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 900,
      currency: "USD",
      date: isoDate(reference, 0, 10),
      description: "Supermercado",
      notes: null,
      accountId: bank.id,
      categoryId: categoryId("Comida"),
    }),
    transactionRepo.create({
      userId: user.id,
      type: "expense",
      amount: 800,
      currency: "USD",
      date: isoDate(reference, 0, 3),
      description: "Alquiler",
      notes: null,
      accountId: bank.id,
      categoryId: categoryId("Alquiler"),
    }),
  ]);

  const budgetRepo = manager.getRepository(Budget);
  await budgetRepo.save([
    budgetRepo.create({
      userId: user.id,
      categoryId: categoryId("Comida"),
      period: monthStart(reference, 0),
      limit: 1000,
      currency: "USD",
      recurring: true,
    }),
  ]);

  const assetRepo = manager.getRepository(Asset);
  const notebook = await assetRepo.save(
    assetRepo.create({
      userId: user.id,
      name: "Notebook",
      type: "investment",
      currency: "USD",
      notes: null,
    }),
  );
  const valuationRepo = manager.getRepository(Valuation);
  await valuationRepo.save(
    valuationRepo.create({
      assetId: notebook.id,
      value: 1500,
      currency: "USD",
      date: monthStart(reference, 0),
      source: "manual",
    }),
  );

  const debtRepo = manager.getRepository(Debt);
  await debtRepo.save(
    debtRepo.create({
      userId: user.id,
      name: "Préstamo de estudio",
      type: "loan",
      balance: 2000,
      currency: "USD",
      date: monthStart(reference, -1),
      assetId: null,
    }),
  );

  const positionRepo = manager.getRepository(Position);
  await positionRepo.save(
    positionRepo.create({
      userId: user.id,
      symbol: "ETH",
      instrument: "Ethereum",
      quantity: 0.3,
      avgCost: 2800,
      currency: "USD",
    }),
  );

  const goalRepo = manager.getRepository(Goal);
  await goalRepo.save(
    goalRepo.create({
      userId: user.id,
      name: "Viaje a Europa",
      targetAmount: 5000,
      savedAmount: 1500,
      currency: "USD",
      targetDate: monthStart(reference, 8),
      sourceAccountId: bank.id,
    }),
  );

  const conversationRepo = manager.getRepository(AiConversation);
  await conversationRepo.save(
    conversationRepo.create({
      userId: user.id,
      question: "¿Cuál es mi saldo en dólares?",
      answer: "Tu saldo total en cuentas USD es de 7.800 USD.",
      contextMeta: {
        period: {
          from: monthStart(reference, 0),
          to: isoDate(reference, 0, 28),
        },
        currency: "USD",
        sources: ["accounts"],
      },
      messages: [
        { role: "user", content: "¿Cuál es mi saldo en dólares?" },
        { role: "assistant", content: "Tenés 7.800 USD entre tus cuentas." },
      ],
    }),
  );
};

export const runSeed = async (dataSource: DataSource): Promise<void> => {
  const reference = new Date();

  await dataSource.transaction(async (manager) => {
    await ensureSystemCategories(manager);
    await ensureExchangeRates(manager, reference);

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
      baseCurrency: "ARS",
      theme: "system",
      aiEnabled: true,
      assistantDestructiveEnabled: false,
    });
    await seedDemoDataset(manager, demo, reference);

    // Empty user: no financial data, to exercise empty states (FR-DAS-008).
    await createUser(manager, passwordHash, {
      name: "Sin Datos",
      email: EMPTY_EMAIL,
      baseCurrency: "ARS",
      theme: "light",
      aiEnabled: false,
      assistantDestructiveEnabled: false,
    });

    const second = await createUser(manager, passwordHash, {
      name: "Ana Probadora",
      email: SECOND_EMAIL,
      baseCurrency: "USD",
      theme: "dark",
      aiEnabled: true,
      assistantDestructiveEnabled: true,
    });
    await seedSecondUserDataset(manager, second, reference);

    const quoteRepo = manager.getRepository(Quote);
    const fetchedAt = reference;
    await quoteRepo.save(
      QUOTES.map((quote) =>
        quoteRepo.create({
          symbol: quote.symbol,
          price: quote.price,
          currency: "USD",
          provider: "seed",
          change24h: quote.change24h,
          fetchedAt,
        }),
      ),
    );

    logger.log(
      `Seeded demo data for ${DEMO_EMAIL}, ${EMPTY_EMAIL} and ${SECOND_EMAIL}`,
    );
  });
};

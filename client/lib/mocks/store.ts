import type { Account, Category, Transaction, User } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export interface MockUserRecord {
  user: User;
  password: string;
}

export type StoredAccount = Account & { userId: string };
export type StoredTransaction = Transaction & { userId: string };

export interface MockState {
  users: MockUserRecord[];
  accounts: StoredAccount[];
  categories: Category[];
  transactions: StoredTransaction[];
}

export const DEMO_EMAIL = "demo@atlassfin.app";
export const DEMO_PASSWORD = "Demo1234!";

const now = new Date();

const dayOfMonth = (offset: number, day: number): string =>
  toIsoDate(new Date(now.getFullYear(), now.getMonth() + offset, day));

const timestamp = (date: Date): string => date.toISOString();

export const mockId = (): string => crypto.randomUUID();

export const signedAmount = (transaction: Transaction): number => {
  if (transaction.type === "income") return transaction.amount;
  if (transaction.type === "expense") return -transaction.amount;
  return transaction.amount;
};

const createInitialState = (): MockState => {
  const demoUser: User = {
    id: mockId(),
    name: "Demo",
    email: DEMO_EMAIL,
    createdAt: timestamp(now),
  };

  const caja: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Caja ARS",
    type: "cash",
    initialBalance: 50_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const banco: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Banco ARS",
    type: "bank",
    initialBalance: 300_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const ahorro: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Ahorro",
    type: "wallet",
    initialBalance: 100_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };

  const category = (
    name: string,
    type: Category["type"],
    color: string,
    icon: string | null,
  ): Category => ({
    id: mockId(),
    name,
    type,
    color,
    icon,
  });

  const sueldo = category("Sueldo", "income", "#22c55e", "wallet");
  const freelance = category("Freelance", "income", "#16a34a", "briefcase");
  const supermercado = category("Supermercado", "expense", "#ef4444", "cart");
  const transporte = category("Transporte", "expense", "#3b82f6", "bus");
  const servicios = category("Servicios", "expense", "#0ea5e9", "receipt");

  const transactions: StoredTransaction[] = [];
  const MONTHS = [-5, -4, -3, -2, -1, 0];
  const SALARY = [880_000, 900_000, 920_000, 900_000, 950_000, 900_000];
  const FREELANCE = [0, 180_000, 0, 240_000, 0, 150_000];
  const FOOD = [150_000, 168_000, 160_000, 185_000, 175_000, 180_000];
  const TRANSPORT = [40_000, 38_000, 45_000, 42_000, 47_000, 44_000];
  const SERVICES = [84_000, 91_000, 97_000, 107_000, 100_000, 100_000];

  for (let index = 0; index < MONTHS.length; index += 1) {
    const offset = MONTHS[index];
    const base = {
      userId: demoUser.id,
      notes: null,
      categoryId: null,
      createdAt: timestamp(now),
      updatedAt: timestamp(now),
      transferAccountId: null,
      transferGroupId: null,
    };

    const pushIncome = (
      amount: number,
      day: number,
      description: string,
      categoryId: string,
    ) => {
      if (amount <= 0) return;
      transactions.push({
        ...base,
        id: mockId(),
        type: "income",
        amount,
        date: dayOfMonth(offset, day),
        description,
        accountId: banco.id,
        categoryId,
      });
    };

    const pushExpense = (
      amount: number,
      day: number,
      description: string,
      accountId: string,
      categoryId: string,
    ) => {
      if (amount <= 0) return;
      transactions.push({
        ...base,
        id: mockId(),
        type: "expense",
        amount,
        date: dayOfMonth(offset, day),
        description,
        accountId,
        categoryId,
      });
    };

    pushIncome(SALARY[index], 5, "Sueldo", sueldo.id);
    pushIncome(FREELANCE[index], 20, "Freelance", freelance.id);

    pushExpense(FOOD[index], 8, "Supermercado", caja.id, supermercado.id);
    pushExpense(TRANSPORT[index], 12, "Transporte", caja.id, transporte.id);
    pushExpense(SERVICES[index], 15, "Servicios", banco.id, servicios.id);
  }

  return {
    users: [{ user: demoUser, password: DEMO_PASSWORD }],
    accounts: [caja, banco, ahorro],
    categories: [sueldo, freelance, supermercado, transporte, servicios],
    transactions,
  };
};

export let mockState: MockState = createInitialState();

export const resetMockState = (): void => {
  mockState = createInitialState();
};

export const findUserRecord = (userId: string): MockUserRecord | undefined =>
  mockState.users.find((record) => record.user.id === userId);

export const findUserByEmail = (email: string): MockUserRecord | undefined =>
  mockState.users.find(
    (record) => record.user.email.toLowerCase() === email.toLowerCase(),
  );

export const getCategoriesByIds = (ids: string[]): Map<string, Category> =>
  new Map(
    mockState.categories
      .filter((category) => ids.includes(category.id))
      .map((category) => [category.id, category]),
  );

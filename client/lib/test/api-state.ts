import type { Account, Category, Transaction, User } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export interface TestUserRecord {
  user: User;
  password: string;
}

export type TestAccount = Account & { userId: string };
export type TestTransaction = Transaction & { userId: string };

export interface TestState {
  users: TestUserRecord[];
  accounts: TestAccount[];
  categories: Category[];
  transactions: TestTransaction[];
  sessionUserId: string | null;
  requests: { method: string; path: string }[];
}

export const TEST_DEMO_EMAIL = "demo@atlassfin.app";
export const TEST_DEMO_PASSWORD = "Demo1234!";

export const testId = (): string => crypto.randomUUID();

export const signedAmount = (transaction: Transaction): number => {
  if (transaction.type === "income") return transaction.amount;
  if (transaction.type === "expense") return -transaction.amount;
  return transaction.amount;
};

const createInitialState = (): TestState => {
  const now = new Date();
  const dayOfMonth = (offset: number, day: number): string =>
    toIsoDate(new Date(now.getFullYear(), now.getMonth() + offset, day));
  const timestamp = now.toISOString();

  const demoUser: User = {
    id: testId(),
    name: "Demo",
    email: TEST_DEMO_EMAIL,
    createdAt: timestamp,
  };

  const caja: TestAccount = {
    id: testId(),
    userId: demoUser.id,
    name: "Caja ARS",
    type: "cash",
    initialBalance: 50_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const banco: TestAccount = {
    id: testId(),
    userId: demoUser.id,
    name: "Banco ARS",
    type: "bank",
    initialBalance: 300_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const ahorro: TestAccount = {
    id: testId(),
    userId: demoUser.id,
    name: "Ahorro",
    type: "wallet",
    initialBalance: 100_000,
    currentBalance: 0,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const category = (
    name: string,
    type: Category["type"],
    color: string,
    icon: string | null,
  ): Category => ({
    id: testId(),
    name,
    type,
    color,
    icon,
    isSystem: true,
  });

  const sueldo = category("Sueldo", "income", "#22c55e", "wallet");
  const freelance = category("Freelance", "income", "#16a34a", "briefcase");
  const supermercado = category("Supermercado", "expense", "#ef4444", "cart");
  const transporte = category("Transporte", "expense", "#3b82f6", "bus");
  const servicios = category("Servicios", "expense", "#0ea5e9", "receipt");

  const transactions: TestTransaction[] = [];
  const months = [-5, -4, -3, -2, -1, 0];
  const salary = [880_000, 900_000, 920_000, 900_000, 950_000, 900_000];
  const freelanceAmounts = [0, 180_000, 0, 240_000, 0, 150_000];
  const food = [150_000, 168_000, 160_000, 185_000, 175_000, 180_000];
  const transport = [40_000, 38_000, 45_000, 42_000, 47_000, 44_000];
  const services = [84_000, 91_000, 97_000, 107_000, 100_000, 100_000];

  for (let index = 0; index < months.length; index += 1) {
    const offset = months[index];
    const base = {
      userId: demoUser.id,
      notes: null,
      categoryId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
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
        id: testId(),
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
        id: testId(),
        type: "expense",
        amount,
        date: dayOfMonth(offset, day),
        description,
        accountId,
        categoryId,
      });
    };

    pushIncome(salary[index], 5, "Sueldo", sueldo.id);
    pushIncome(freelanceAmounts[index], 20, "Freelance", freelance.id);
    pushExpense(food[index], 8, "Supermercado", caja.id, supermercado.id);
    pushExpense(transport[index], 12, "Transporte", caja.id, transporte.id);
    pushExpense(services[index], 15, "Servicios", banco.id, servicios.id);
  }

  return {
    users: [{ user: demoUser, password: TEST_DEMO_PASSWORD }],
    accounts: [caja, banco, ahorro],
    categories: [sueldo, freelance, supermercado, transporte, servicios],
    transactions,
    sessionUserId: demoUser.id,
    requests: [],
  };
};

export let testState: TestState = createInitialState();

export const resetTestState = (): void => {
  testState = createInitialState();
};

export const currentTestUser = (): User | null => {
  const record = testState.users.find(
    (item) => item.user.id === testState.sessionUserId,
  );
  return record?.user ?? null;
};

export const deriveTestAccount = (account: TestAccount): Account => ({
  ...account,
  currentBalance:
    account.initialBalance +
    testState.transactions
      .filter((transaction) => transaction.accountId === account.id)
      .reduce((total, transaction) => total + signedAmount(transaction), 0),
});

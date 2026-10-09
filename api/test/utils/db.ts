import { DataSource } from "typeorm";

/**
 * Global reference data that must survive between tests (FX rates are seeded on
 * module init and are not user-owned).
 */
const PRESERVED_TABLES = ["exchange_rates", "migrations"];

/**
 * A syntactically valid v4 UUID that no test data uses, to exercise the
 * "resource not found" / "belongs to another user" paths.
 */
export const MISSING_UUID = "00000000-0000-4000-8000-000000000000";

export const truncateAll = async (dataSource: DataSource): Promise<void> => {
  const rows: Array<{ tablename: string }> = await dataSource.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tables = rows
    .map((row) => row.tablename)
    .filter((table) => !PRESERVED_TABLES.includes(table));
  if (tables.length === 0) return;
  const list = tables.map((table) => `"${table}"`).join(", ");
  await dataSource.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
};

interface SystemCategory {
  name: string;
  type: "income" | "expense";
  color: string;
}

const SYSTEM_CATEGORIES: SystemCategory[] = [
  { name: "salary", type: "income", color: "#22c55e" },
  { name: "freelance", type: "income", color: "#16a34a" },
  { name: "other_income", type: "income", color: "#4ade80" },
  { name: "food", type: "expense", color: "#ef4444" },
  { name: "transport", type: "expense", color: "#3b82f6" },
  { name: "housing", type: "expense", color: "#f59e0b" },
  { name: "services", type: "expense", color: "#0ea5e9" },
  { name: "entertainment", type: "expense", color: "#a855f7" },
  { name: "other_expense", type: "expense", color: "#64748b" },
];

/**
 * Inserts the system categories (`user_id = NULL`) that the seed creates in a
 * real deployment, so tests can use them without depending on the seed script.
 */
export const seedSystemCategories = async (
  dataSource: DataSource,
): Promise<void> => {
  for (const category of SYSTEM_CATEGORIES) {
    await dataSource.query(
      `INSERT INTO categories (id, user_id, name, type, color, icon, archived)
       SELECT gen_random_uuid(), NULL, $1, $2, $3, NULL, false
       WHERE NOT EXISTS (
         SELECT 1 FROM categories WHERE user_id IS NULL AND type = $2 AND name = $1
       )`,
      [category.name, category.type, category.color],
    );
  }
};

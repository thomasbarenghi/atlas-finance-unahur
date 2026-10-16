import { DataSource } from "typeorm";

/**
 * A syntactically valid v4 UUID that no test data uses, to exercise the
 * "resource not found" / "belongs to another user" paths.
 */
export const MISSING_UUID = "00000000-0000-4000-8000-000000000000";

/** Fixed category catalog shared by every test (FR-TRX-002, v0.3). */
export const FIXED_CATEGORIES = [
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

/**
 * Inserts the fixed categories that the seed creates in a real deployment, so
 * tests can use them without depending on the seed script.
 */
export const seedFixedCategories = async (
  dataSource: DataSource,
): Promise<void> => {
  for (const category of FIXED_CATEGORIES) {
    await dataSource.query(
      `INSERT INTO categories (id, name, type, color, icon)
       SELECT gen_random_uuid(), $1, $2, $3, $4
       WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = $1)`,
      [category.name, category.type, category.color, category.icon],
    );
  }
};

export const truncateAll = async (dataSource: DataSource): Promise<void> => {
  const rows: Array<{ tablename: string }> = await dataSource.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tables = rows
    .map((row) => row.tablename)
    .filter((table) => table !== "migrations");
  if (tables.length > 0) {
    const list = tables.map((table) => `"${table}"`).join(", ");
    await dataSource.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
  }
  await seedFixedCategories(dataSource);
};

import {
  accountEndpoints,
  authEndpoints,
  categoryEndpoints,
  dashboardEndpoints,
  transactionEndpoints,
  userEndpoints,
} from "@/lib/api/endpoints";

/**
 * Invokes every function of the endpoint layer. Used by contract tests that
 * exercise both the in-memory mock branch and the real HTTP branch.
 */
export const callAllEndpoints = async (): Promise<void> => {
  await authEndpoints.login({ email: "a@b.com", password: "Password1" });
  await authEndpoints.register({
    name: "Ana",
    email: "a@b.com",
    password: "Password1",
  });
  await authEndpoints.logout();
  await authEndpoints.me();

  await userEndpoints.updateMe({ name: "Ana" });

  await accountEndpoints.list();
  await accountEndpoints.create({
    name: "Caja",
    type: "cash",
    initialBalance: 0,
  });
  await accountEndpoints.update("acc-1", { name: "X" });
  await accountEndpoints.remove("acc-1");

  await categoryEndpoints.list();

  await transactionEndpoints.list({ page: 1, pageSize: 5 });
  await transactionEndpoints.create({
    type: "expense",
    amount: 1,
    date: "2026-01-01",
    description: "x",
    accountId: "acc-1",
  });
  await transactionEndpoints.update("tx-1", { description: "x" });
  await transactionEndpoints.remove("tx-1");

  await dashboardEndpoints.get({ from: "2026-01-01", to: "2026-01-31" });
};

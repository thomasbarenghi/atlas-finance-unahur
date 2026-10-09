import {
  accountEndpoints,
  assetEndpoints,
  assistantEndpoints,
  authEndpoints,
  budgetEndpoints,
  categoryEndpoints,
  dashboardEndpoints,
  debtEndpoints,
  goalEndpoints,
  positionEndpoints,
  quoteEndpoints,
  referenceEndpoints,
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
  await authEndpoints.forgotPassword({ email: "a@b.com" });
  await authEndpoints.resetPassword({ token: "t", password: "Password1" });

  await userEndpoints.updateMe({ name: "Ana" });
  await referenceEndpoints.currencies();

  await accountEndpoints.list();
  await accountEndpoints.create({
    name: "Caja",
    type: "cash",
    currency: "ARS",
    initialBalance: 0,
  });
  await accountEndpoints.update("acc-1", { name: "X" });
  await accountEndpoints.archive("acc-1");
  await accountEndpoints.restore("acc-1");

  await goalEndpoints.list();
  await goalEndpoints.create({
    name: "Meta",
    targetAmount: 100,
    currency: "ARS",
  });
  await goalEndpoints.update("goal-1", { name: "X" });
  await goalEndpoints.archive("goal-1");
  await goalEndpoints.restore("goal-1");

  await categoryEndpoints.list();
  await categoryEndpoints.create({
    name: "Comida",
    type: "expense",
    color: "#fff",
  });
  await categoryEndpoints.update("cat-1", { name: "X" });
  await categoryEndpoints.archive("cat-1");

  await transactionEndpoints.list({ type: "expense" });
  await transactionEndpoints.create({
    type: "expense",
    amount: 1,
    currency: "ARS",
    date: "2026-01-01",
    description: "x",
    accountId: "acc-1",
  });
  await transactionEndpoints.update("tx-1", { description: "x" });
  await transactionEndpoints.remove("tx-1");

  await budgetEndpoints.list("2026-01");
  await budgetEndpoints.create({
    categoryId: "cat-1",
    period: "2026-01",
    limit: 1,
    currency: "ARS",
  });
  await budgetEndpoints.update("b-1", { limit: 2 });
  await budgetEndpoints.remove("b-1");
  await budgetEndpoints.copyPrevious({ period: "2026-02" });

  await assetEndpoints.list();
  await assetEndpoints.create({
    name: "Depto",
    type: "property",
    currency: "ARS",
    initialValue: 1,
    date: "2026-01-01",
  });
  await assetEndpoints.update("asset-1", { name: "X" });
  await assetEndpoints.archive("asset-1");
  await assetEndpoints.valuations("asset-1");
  await assetEndpoints.createValuation("asset-1", {
    value: 1,
    currency: "ARS",
    date: "2026-01-01",
  });

  await debtEndpoints.list();
  await debtEndpoints.create({
    name: "Deuda",
    type: "loan",
    balance: 1,
    currency: "ARS",
    date: "2026-01-01",
  });
  await debtEndpoints.update("debt-1", { balance: 2 });
  await debtEndpoints.archive("debt-1");

  await positionEndpoints.list();
  await positionEndpoints.create({
    symbol: "BTC",
    instrument: "Bitcoin",
    quantity: 1,
    avgCost: 1,
    currency: "USD",
  });
  await positionEndpoints.update("pos-1", { quantity: 2 });
  await positionEndpoints.remove("pos-1");
  await positionEndpoints.archive("pos-1");
  await positionEndpoints.restore("pos-1");

  await quoteEndpoints.list();
  await dashboardEndpoints.get({ from: "2026-01-01", to: "2026-01-31" });

  await assistantEndpoints.conversations();
  await assistantEndpoints.clearConversations();
  await assistantEndpoints.deleteConversation("c-1");
  await assistantEndpoints.confirmAction("a-1", "t");
  await assistantEndpoints.cancelAction("a-1", "t");
};

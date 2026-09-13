import { AccountsService } from "../../../accounts/accounts.service";
import { UsersService } from "../../../users/users.service";
import { ReferenceResolver } from "../reference-resolver.service";
import { AccountTools } from "./account.tools";

const build = () => {
  const createAccount = jest.fn().mockResolvedValue({
    id: "a1",
    name: "Ahorro",
    type: "bank",
    currency: "ARS",
    initialBalance: 0,
    currentBalance: 0,
  });
  const accounts = { createAccount } as unknown as AccountsService;
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  } as unknown as UsersService;
  const resolver = {} as unknown as ReferenceResolver;

  const tools = new AccountTools(accounts, users, resolver);
  const createDefinition = tools
    .definitions()
    .find((definition) => definition.name === "createAccount");
  if (!createDefinition?.prepare || !createDefinition.execute) {
    throw new Error("createAccount tool not found");
  }
  return { createDefinition, createAccount };
};

describe("AccountTools.createAccount", () => {
  it("defaults the currency to the user base currency", async () => {
    const { createDefinition } = build();

    const prepared = await createDefinition.prepare!("user-1", {
      name: "Ahorro",
      type: "bank",
    });

    expect(prepared.args.currency).toBe("ARS");
    expect(prepared.createdEntityName).toBe("Ahorro");
  });

  it("executes with the prepared arguments", async () => {
    const { createDefinition, createAccount } = build();
    const prepared = await createDefinition.prepare!("user-1", {
      name: "Ahorro",
      type: "bank",
      currency: "USD",
    });

    await createDefinition.execute("user-1", prepared.args);

    expect(createAccount).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ name: "Ahorro", currency: "USD" }),
    );
  });
});

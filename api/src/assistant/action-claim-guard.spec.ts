import { claimsUnproposedAction } from "./action-claim-guard";

describe("claimsUnproposedAction", () => {
  it("detects an action announced without its tool (phantom proposal)", () => {
    const answer =
      "Te propuse dos acciones: crear la cuenta y transferir 250 ARS. " +
      "La transferencia quedará lista para confirmar en la tarjeta.";
    expect(claimsUnproposedAction(answer, ["createAccount"])).toBe(true);
  });

  it("does not flag when every mentioned action was proposed", () => {
    const answer =
      "Te propuse crear la cuenta y transferir 250 ARS. " +
      "Confirmá la transferencia en la tarjeta.";
    expect(
      claimsUnproposedAction(answer, [
        "createAccount",
        "transferBetweenAccounts",
      ]),
    ).toBe(false);
  });

  it("does not flag answers without a proposal promise", () => {
    expect(claimsUnproposedAction("Tus cuentas suman 10.000 ARS.", [])).toBe(
      false,
    );
    expect(
      claimsUnproposedAction(
        "No puedo transferir a una cuenta inexistente.",
        [],
      ),
    ).toBe(false);
  });

  it("does not flag a negated promise", () => {
    expect(
      claimsUnproposedAction("No te propuse ninguna transferencia.", []),
    ).toBe(false);
    expect(
      claimsUnproposedAction(
        "No quedó pendiente ninguna transferencia para confirmar.",
        [],
      ),
    ).toBe(false);
  });

  it("does not flag generic explanations about confirmation", () => {
    expect(
      claimsUnproposedAction(
        "Las acciones requieren que las confirmes en la tarjeta; no se ejecutan solas.",
        [],
      ),
    ).toBe(false);
  });

  it("flags a claimed action when nothing was proposed", () => {
    expect(
      claimsUnproposedAction(
        "Te dejé la tarjeta para crear la cuenta y confirmala.",
        [],
      ),
    ).toBe(true);
  });
});

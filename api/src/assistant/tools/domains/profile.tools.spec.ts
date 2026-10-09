import { ProfileTools } from "./profile.tools";

const build = () => {
  const users = {
    getById: jest.fn().mockResolvedValue({ name: "Ana", theme: "system" }),
    updateMe: jest.fn().mockResolvedValue({ name: "Ana Maria" }),
  };
  const tools = new ProfileTools(users as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, users };
};

describe("ProfileTools", () => {
  it("returns the profile", async () => {
    const { byName, users } = build();
    const result = await byName("getProfile").execute!("u1", {});
    expect(users.getById).toHaveBeenCalledWith("u1");
    expect(result.summary).toContain("Perfil");
  });

  it("updates preferences and rejects empty changes", async () => {
    const { byName, users } = build();
    const definition = byName("updatePreferences");

    const prepared = await definition.prepare!("u1", {
      theme: "dark",
      aiEnabled: true,
    });
    expect(prepared.args).toMatchObject({ theme: "dark", aiEnabled: true });

    await expect(definition.prepare!("u1", {})).rejects.toThrow(/preferencia/);

    await definition.execute!("u1", { name: "Ana Maria" });
    expect(users.updateMe).toHaveBeenCalledWith("u1", { name: "Ana Maria" });
  });
});

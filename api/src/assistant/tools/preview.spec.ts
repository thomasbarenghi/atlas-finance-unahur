import { definedPreviewFields } from "./preview";

class SampleDto {
  name?: string;
  type?: string;
  currency?: string;
  notes?: string | null;
  limit?: number;
}

describe("definedPreviewFields", () => {
  it("omits undefined/null/empty values and labels known keys", () => {
    const dto = Object.assign(new SampleDto(), {
      name: "Caja",
      currency: "ARS",
      notes: null,
    });

    expect(definedPreviewFields(dto)).toEqual([
      { label: "Nombre", value: "Caja" },
      { label: "Moneda", value: "ARS" },
    ]);
  });

  it("keeps zero and false values", () => {
    expect(
      definedPreviewFields({ initialBalance: 0, recurring: false }),
    ).toEqual([
      { label: "Saldo inicial", value: "0" },
      { label: "Renovación", value: "false" },
    ]);
  });

  it("falls back to the raw key when there is no label", () => {
    expect(definedPreviewFields({ foo: "bar" })).toEqual([
      { label: "foo", value: "bar" },
    ]);
  });
});

import { IsString, Length } from "class-validator";
import { ErrorCode } from "../../common/errors/error-codes";
import {
  isUuid,
  jsonSchema,
  optionalString,
  parseToolArgs,
  requireString,
  validateChanges,
  validateToolArgs,
} from "./tool-input";

class SampleDto {
  @IsString()
  @Length(2, 10)
  name!: string;
}

describe("tool-input", () => {
  it("parses valid JSON object arguments", () => {
    expect(
      parseToolArgs({
        id: "1",
        type: "function",
        function: { name: "x", arguments: '{"a":1}' },
      }),
    ).toEqual({ a: 1 });
  });

  it("defaults to an empty object for empty arguments", () => {
    expect(
      parseToolArgs({
        id: "1",
        type: "function",
        function: { name: "x", arguments: "" },
      }),
    ).toEqual({});
  });

  it("rejects invalid or non-object arguments", () => {
    for (const args of ["not-json", "[1,2]"]) {
      expect(() =>
        parseToolArgs({
          id: "1",
          type: "function",
          function: { name: "x", arguments: args },
        }),
      ).toThrow(/interpretar/);
    }
  });

  it("detects UUIDs", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000000")).toBe(true);
    expect(isUuid("nope")).toBe(false);
    expect(isUuid(123)).toBe(false);
  });

  it("validates and returns typed args, rejecting unknown/invalid fields", async () => {
    await expect(
      validateToolArgs(SampleDto, { name: "ok" }),
    ).resolves.toMatchObject({
      name: "ok",
    });
    await expect(
      validateToolArgs(SampleDto, { name: "ok", extra: 1 }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_ERROR },
    });
    await expect(
      validateToolArgs(SampleDto, { name: "x" }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.VALIDATION_ERROR },
    });
  });

  it("requires at least one change", async () => {
    expect(() => validateChanges(SampleDto, {}, "empty")).toThrow(/empty/);
    await expect(
      validateChanges(SampleDto, { name: "ok" }, "empty"),
    ).resolves.toBeDefined();
  });

  it("requireString/optionalString normalize values", () => {
    expect(requireString("  hi  ", "msg")).toBe("hi");
    expect(() => requireString("   ", "msg")).toThrow(/msg/);
    expect(optionalString("  hi  ")).toBe("hi");
    expect(optionalString("")).toBeUndefined();
    expect(optionalString(123)).toBeUndefined();
  });

  it("builds a JSON schema object", () => {
    expect(jsonSchema({ a: { type: "string" } }, ["a"])).toEqual({
      type: "object",
      properties: { a: { type: "string" } },
      required: ["a"],
      additionalProperties: false,
    });
  });
});

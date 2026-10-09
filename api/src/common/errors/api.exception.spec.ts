import { HttpStatus } from "@nestjs/common";
import { ApiException } from "./api.exception";
import { ErrorCode } from "./error-codes";

describe("ApiException", () => {
  it("builds the response body with code and status", () => {
    const error = new ApiException(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      "missing",
    );
    expect(error.getStatus()).toBe(404);
    expect(error.getResponse()).toEqual({
      statusCode: 404,
      code: ErrorCode.NOT_FOUND,
      message: "missing",
    });
  });

  it("includes fieldErrors when provided", () => {
    const error = new ApiException(
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      "bad",
      { name: ["required"] },
    );
    expect(error.getResponse()).toMatchObject({
      fieldErrors: { name: ["required"] },
    });
  });
});

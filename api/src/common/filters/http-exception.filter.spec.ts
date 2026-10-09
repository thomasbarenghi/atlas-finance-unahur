import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { ErrorCode } from "../errors/error-codes";
import { GlobalExceptionFilter } from "./http-exception.filter";

const buildHost = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as any;
  return { host, status, json };
};

describe("GlobalExceptionFilter", () => {
  const filter = new GlobalExceptionFilter();

  it("normalizes an ApiException keeping its code and fieldErrors", () => {
    const { host, status, json } = buildHost();
    filter.catch(
      new HttpException(
        {
          statusCode: 400,
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          fieldErrors: { name: ["required"] },
        },
        400,
      ),
      host,
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      fieldErrors: { name: ["required"] },
    });
  });

  it("falls back to a status-derived code and joins array messages", () => {
    const { host, json } = buildHost();
    filter.catch(new BadRequestException(["a", "b"]), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.VALIDATION_ERROR,
        message: "a, b",
      }),
    );
  });

  it("uses the exception message for string payloads", () => {
    const { host, json } = buildHost();
    filter.catch(new NotFoundException("missing"), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: "missing" }),
    );
  });

  it("hides details of server errors", () => {
    const { host, json } = buildHost();
    filter.catch(new HttpException("boom", 500), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: "Internal server error",
      }),
    );
  });

  it("maps unknown errors to a generic 500", () => {
    const { host, json } = buildHost();
    filter.catch(new Error("boom"), host);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
    });
  });

  it("omits fieldErrors when the payload has none", () => {
    const { host, json } = buildHost();
    filter.catch(new HttpException({ foo: "bar" }, 400), host);
    expect(json.mock.calls[0][0]).not.toHaveProperty("fieldErrors");
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.VALIDATION_ERROR }),
    );
  });
});

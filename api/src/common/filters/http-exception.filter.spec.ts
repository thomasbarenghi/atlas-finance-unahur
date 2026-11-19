import { HttpException, HttpStatus } from "@nestjs/common";
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

  it("passes through a 4xx payload", () => {
    const { host, status, json } = buildHost();
    const payload = {
      statusCode: 400,
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      fieldErrors: { name: ["required"] },
    };
    filter.catch(new HttpException(payload, 400), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(payload);
  });

  it("uses the exception message when a 4xx payload is not an object", () => {
    const { host, json } = buildHost();
    filter.catch(new HttpException("missing", 404), host);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: "missing",
    });
  });

  it("hides details of server errors", () => {
    const { host, json } = buildHost();
    filter.catch(new HttpException("boom", 500), host);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: "Internal server error",
    });
  });

  it("maps unknown errors to a generic 500", () => {
    const { host, json } = buildHost();
    filter.catch(new Error("boom"), host);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  });
});

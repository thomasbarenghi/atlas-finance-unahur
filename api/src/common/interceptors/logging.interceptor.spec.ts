import { HttpException } from "@nestjs/common";
import { firstValueFrom, of, throwError } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

const buildContext = (method = "GET", url = "/api/x", statusCode = 200) => {
  const response = { statusCode };
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, originalUrl: url }),
      getResponse: () => response,
    }),
  } as any;
};

describe("LoggingInterceptor", () => {
  const interceptor = new LoggingInterceptor();

  it("passes through successful responses", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(buildContext(), { handle: () => of("ok") } as any),
    );
    expect(result).toBe("ok");
  });

  it("passes through errors", async () => {
    await expect(
      firstValueFrom(
        interceptor.intercept(buildContext(), {
          handle: () => throwError(() => new HttpException("x", 500)),
        } as any),
      ),
    ).rejects.toBeInstanceOf(HttpException);
  });
});

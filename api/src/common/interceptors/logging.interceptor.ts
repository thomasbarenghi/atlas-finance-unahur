import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();
    const { method, originalUrl } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const status = http.getResponse<Response>().statusCode;
          this.logger.log(
            `${method} ${originalUrl} ${status} ${Date.now() - startedAt}ms`,
          );
        },
        error: (exception: unknown) => {
          const status =
            exception instanceof HttpException ? exception.getStatus() : 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}

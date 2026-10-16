import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { ApiErrorBody, ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { AuthUser } from "../common/types/auth-user";
import { AssistantService } from "./assistant.service";
import { AssistantMessageDto } from "./dto/assistant-message.dto";

@Controller("assistant")
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("messages")
  async stream(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: AssistantMessageDto,
    @Res() response: Response,
  ): Promise<void> {
    const userId = await this.assistantService.resolveUserId(user?.id);

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();

    try {
      for await (const event of this.assistantService.answer(userId, dto)) {
        response.write(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (error) {
      if (!(error instanceof ApiException)) {
        this.logger.error(
          "Assistant stream failed",
          error instanceof Error ? error.stack : String(error),
        );
      }
      const body: Pick<ApiErrorBody, "code" | "message"> =
        error instanceof ApiException
          ? (error.getResponse() as ApiErrorBody)
          : {
              code: ErrorCode.AI_UNAVAILABLE,
              message: "El asistente no está disponible",
            };
      response.write(
        `event: error\ndata: ${JSON.stringify({
          code: body.code,
          message: body.message,
        })}\n\n`,
      );
    } finally {
      response.end();
    }
  }
}

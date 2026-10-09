import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { Paginated, PaginationDto } from "../common/dto/pagination.dto";
import { ApiErrorBody, ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AuthUser } from "../common/types/auth-user";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { ActionResultDto } from "./actions/action-result.dto";
import { AssistantService } from "./assistant.service";
import { AssistantMessageDto } from "./dto/assistant-message.dto";
import { ConfirmActionDto } from "./dto/confirm-action.dto";
import {
  ConversationResponse,
  PaginatedConversationsDto,
} from "./dto/conversation-response.dto";

@ApiTags("assistant")
@Controller("assistant")
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiProduces("text/event-stream")
  @Post("messages")
  @ApiOperation({
    summary: "Responde con un stream SSE calculado sobre los datos del usuario",
  })
  @ApiOkResponse({
    description:
      "Server-Sent Events: `meta`, `token`, `action_proposal`, `action_error`, `done`",
    content: { "text/event-stream": { schema: { type: "string" } } },
  })
  async stream(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: AssistantMessageDto,
    @Res() response: Response,
  ): Promise<void> {
    const userId = await this.assistantService.resolveUserId(user?.id);
    await this.assistantService.assertAiEnabled(userId);

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

  @Get("conversations")
  @ApiBearerAuth()
  @ApiErrors(400, 401)
  @ApiOperation({ summary: "Lista las conversaciones del usuario" })
  @ApiOkResponse({ type: PaginatedConversationsDto })
  list(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationDto,
  ): Promise<Paginated<ConversationResponse>> {
    return this.assistantService.listConversations(user.id, pagination);
  }

  @Get("conversations/:id")
  @ApiBearerAuth()
  @ApiErrors(400, 401, 404)
  @ApiOperation({ summary: "Obtiene una conversación del usuario" })
  @ApiOkResponse({ type: ConversationResponse })
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<ConversationResponse> {
    return this.assistantService.getConversation(user.id, id);
  }

  @Delete("conversations/:id")
  @ApiBearerAuth()
  @ApiErrors(401, 404)
  @ApiOperation({ summary: "Elimina una conversación" })
  @ApiOkResponse({ description: "Conversación eliminada" })
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.assistantService.deleteConversation(user.id, id);
  }

  @Delete("conversations")
  @ApiBearerAuth()
  @ApiErrors(401)
  @ApiOperation({ summary: "Elimina todo el historial de conversaciones" })
  @ApiOkResponse({ description: "Historial eliminado" })
  clear(@CurrentUser() user: AuthUser): Promise<void> {
    return this.assistantService.deleteConversations(user.id);
  }

  @Post("actions/:id/confirm")
  @ApiBearerAuth()
  @ApiErrors(400, 401, 404, 409)
  @ApiOperation({
    summary: "Confirma y ejecuta una acción propuesta con token de un solo uso",
  })
  @ApiOkResponse({ type: ActionResultDto })
  confirmAction(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmActionDto,
  ): Promise<ActionResultDto> {
    return this.assistantService.confirmAction(user.id, id, dto.token);
  }

  @Post("actions/:id/cancel")
  @ApiBearerAuth()
  @ApiErrors(400, 401, 404, 409)
  @ApiOperation({ summary: "Cancela una acción propuesta" })
  @ApiOkResponse({ type: ActionResultDto })
  cancelAction(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmActionDto,
  ): Promise<ActionResultDto> {
    return this.assistantService.cancelAction(user.id, id, dto.token);
  }
}

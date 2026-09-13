import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { DataSource, Repository } from "typeorm";
import { ApiErrorBody, ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import { AppConfig } from "../../config/configuration";
import { ToolRegistry } from "../tools/tool-registry.service";
import type {
  ActionPreview,
  ActionProposal,
  PreparedAction,
  ToolDefinition,
} from "../tools/tool.types";
import { User } from "../../users/entities/user.entity";
import { ActionResultDto } from "./action-result.dto";
import { AssistantAction } from "../entities/assistant-action.entity";

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const tokenMatches = (token: string, storedHash: string | null): boolean => {
  if (!storedHash) return false;
  const computed = Buffer.from(hashToken(token));
  const stored = Buffer.from(storedHash);
  return computed.length === stored.length && timingSafeEqual(computed, stored);
};

export interface ProposeActionInput {
  user: User;
  conversationId: string | null;
  definition: ToolDefinition;
  rawArgs: Record<string, unknown>;
  prepared: PreparedAction | null;
  preview: ActionPreview;
  summary: string;
  planId: string | null;
  step: number;
}

@Injectable()
export class PendingActionsService {
  private readonly logger = new Logger(PendingActionsService.name);

  constructor(
    @InjectRepository(AssistantAction)
    private readonly actionsRepository: Repository<AssistantAction>,
    private readonly dataSource: DataSource,
    private readonly registry: ToolRegistry,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async propose(input: ProposeActionInput): Promise<ActionProposal> {
    const token = randomBytes(32).toString("hex");
    const ttl = this.config.get("ai", { infer: true }).actionTtlMs;
    const expiresAt = new Date(Date.now() + ttl);
    const saved = await this.actionsRepository.save(
      this.actionsRepository.create({
        userId: input.user.id,
        conversationId: input.conversationId,
        planId: input.planId,
        step: input.step,
        toolName: input.definition.name,
        classification: input.definition.classification,
        args: input.prepared?.args ?? input.rawArgs,
        resolved: input.prepared !== null,
        preview: input.preview,
        status: "proposed",
        tokenHash: hashToken(token),
        result: null,
        errorMessage: null,
        expiresAt,
      }),
    );

    return {
      actionId: saved.id,
      token,
      name: input.definition.name,
      title: input.definition.title,
      classification: input.definition.classification,
      destructive: input.definition.classification === "destructive",
      summary: input.summary,
      preview: input.preview,
      expiresAt: expiresAt.toISOString(),
      planId: input.planId,
      step: input.step,
      pending: input.prepared === null,
    };
  }

  async confirm(
    user: User,
    actionId: string,
    token: string,
  ): Promise<ActionResultDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AssistantAction);
      const action = await repository.findOne({
        where: { id: actionId, userId: user.id },
        lock: { mode: "pessimistic_write" },
      });
      if (!action) {
        throw new ApiException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          "La acción no existe",
        );
      }
      if (action.status === "executed") {
        throw new ApiException(
          ErrorCode.ACTION_ALREADY_EXECUTED,
          HttpStatus.CONFLICT,
          "La acción ya fue ejecutada",
        );
      }
      if (action.status === "cancelled" || action.status === "expired") {
        throw new ApiException(
          ErrorCode.ACTION_NOT_ALLOWED,
          HttpStatus.CONFLICT,
          "La acción ya no está disponible",
        );
      }
      if (
        action.status === "proposed" &&
        action.expiresAt.getTime() <= Date.now()
      ) {
        action.status = "expired";
        await repository.save(action);
        throw new ApiException(
          ErrorCode.ACTION_EXPIRED,
          HttpStatus.GONE,
          "La acción expiró; volvé a pedirla al asistente",
        );
      }
      if (!token || !tokenMatches(token, action.tokenHash)) {
        throw new ApiException(
          ErrorCode.ACTION_NOT_ALLOWED,
          HttpStatus.FORBIDDEN,
          "El token de confirmación no es válido",
        );
      }

      const definition = this.registry.get(action.toolName);
      if (!definition?.execute) {
        throw new ApiException(
          ErrorCode.ACTION_NOT_ALLOWED,
          HttpStatus.BAD_REQUEST,
          "La acción solicitada no está disponible",
        );
      }
      if (
        definition.classification === "destructive" &&
        !user.assistantDestructiveEnabled
      ) {
        throw new ApiException(
          ErrorCode.DESTRUCTIVE_DISABLED,
          HttpStatus.FORBIDDEN,
          "Las acciones destructivas están deshabilitadas",
        );
      }

      await this.assertPlanOrder(repository, action);
      await this.resolveDeferred(user, definition, action);

      const result = await this.run(user, definition, action);
      action.status = result.status === "executed" ? "executed" : "failed";
      action.result = {
        summary: result.summary,
        entity: result.entity,
        code: result.code ?? null,
      };
      action.errorMessage = result.status === "failed" ? result.summary : null;
      await repository.save(action);
      return result;
    });
  }

  async cancel(
    user: User,
    actionId: string,
    token: string,
  ): Promise<ActionResultDto> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AssistantAction);
      const action = await repository.findOne({
        where: { id: actionId, userId: user.id },
        lock: { mode: "pessimistic_write" },
      });
      if (!action) {
        throw new ApiException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          "La acción no existe",
        );
      }
      if (action.status !== "proposed" && action.status !== "failed") {
        throw new ApiException(
          ErrorCode.ACTION_NOT_ALLOWED,
          HttpStatus.CONFLICT,
          "La acción ya no está disponible",
        );
      }
      if (!token || !tokenMatches(token, action.tokenHash)) {
        throw new ApiException(
          ErrorCode.ACTION_NOT_ALLOWED,
          HttpStatus.FORBIDDEN,
          "El token de confirmación no es válido",
        );
      }
      action.status = "cancelled";
      await repository.save(action);
      return {
        actionId: action.id,
        name: action.toolName,
        title: action.preview?.title ?? action.toolName,
        classification: action.classification,
        status: "cancelled",
        summary: "Acción cancelada.",
        entity: null,
      };
    });
  }

  /**
   * Registra una tool de lectura ejecutada en `assistant_actions` para
   * trazabilidad. Es best-effort: una falla de auditoría no debe romper la
   * respuesta al usuario.
   */
  async recordRead(
    user: User,
    conversationId: string,
    definition: ToolDefinition,
    args: Record<string, unknown>,
    summary: string,
  ): Promise<void> {
    try {
      await this.actionsRepository.save(
        this.actionsRepository.create({
          userId: user.id,
          conversationId,
          planId: null,
          step: 0,
          resolved: true,
          toolName: definition.name,
          classification: definition.classification,
          args,
          preview: { title: definition.title, summary, fields: [] },
          status: "executed",
          tokenHash: null,
          result: { summary },
          errorMessage: null,
          expiresAt: new Date(),
        }),
      );
    } catch (error) {
      this.logger.error(
        "Assistant read audit failed",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Garantiza el orden del plan: no se puede ejecutar un paso mientras algún
   * paso anterior del mismo `planId` no esté ejecutado o cancelado. Sin esto,
   * la dependencia sólo estaría protegida por la UI.
   */
  private async assertPlanOrder(
    repository: Repository<AssistantAction>,
    action: AssistantAction,
  ): Promise<void> {
    if (!action.planId) return;
    const siblings = await repository.find({
      where: { userId: action.userId, planId: action.planId },
    });
    const blocker = siblings.find(
      (sibling) =>
        sibling.id !== action.id &&
        sibling.step < action.step &&
        sibling.status !== "executed" &&
        sibling.status !== "cancelled",
    );
    if (blocker) {
      throw new ApiException(
        ErrorCode.ACTION_DEPENDENCY_PENDING,
        HttpStatus.CONFLICT,
        `La acción depende de "${blocker.preview?.title ?? blocker.toolName}" (paso ${blocker.step + 1}), que todavía no se completó. Confirmala o cancelala primero.`,
      );
    }
  }

  private async resolveDeferred(
    user: User,
    definition: ToolDefinition,
    action: AssistantAction,
  ): Promise<void> {
    if (action.resolved) return;
    if (!definition.prepare) {
      throw new ApiException(
        ErrorCode.ACTION_NOT_ALLOWED,
        HttpStatus.BAD_REQUEST,
        "La acción solicitada no está disponible",
      );
    }
    try {
      const prepared = await definition.prepare(user.id, action.args);
      action.args = prepared.args;
      action.preview = prepared.preview;
      action.resolved = true;
    } catch (error) {
      if (error instanceof ApiException) {
        const body = error.getResponse() as ApiErrorBody;
        if (body.code === ErrorCode.REFERENCE_PENDING) {
          throw new ApiException(
            ErrorCode.ACTION_DEPENDENCY_PENDING,
            HttpStatus.CONFLICT,
            `${body.message} Confirmá primero la acción de la que depende.`,
          );
        }
      }
      throw error;
    }
  }

  private async run(
    user: User,
    definition: ToolDefinition,
    action: AssistantAction,
  ): Promise<ActionResultDto> {
    try {
      const handler = await definition.execute(user.id, action.args);
      return {
        actionId: action.id,
        name: action.toolName,
        title: action.preview?.title ?? action.toolName,
        classification: action.classification,
        status: "executed",
        summary: handler.summary,
        entity: handler.entity ?? null,
      };
    } catch (error) {
      if (error instanceof ApiException) {
        const body = error.getResponse() as ApiErrorBody;
        return {
          actionId: action.id,
          name: action.toolName,
          title: action.preview?.title ?? action.toolName,
          classification: action.classification,
          status: "failed",
          summary: body.message,
          entity: null,
          code: body.code,
          fieldErrors: body.fieldErrors,
        };
      }
      this.logger.error("Assistant action execution failed");
      return {
        actionId: action.id,
        name: action.toolName,
        title: action.preview?.title ?? action.toolName,
        classification: action.classification,
        status: "failed",
        summary: "No se pudo completar la acción.",
        entity: null,
        code: ErrorCode.INTERNAL_ERROR,
      };
    }
  }
}

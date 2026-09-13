import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../../common/errors/api.exception";
import { ErrorCode } from "../../common/errors/error-codes";
import type { AiTool, AiToolCall } from "../../shared/ai/ai.service";
import { User } from "../../users/entities/user.entity";
import { AccountTools } from "./domains/account.tools";
import { AssetTools } from "./domains/asset.tools";
import { BudgetTools } from "./domains/budget.tools";
import { CategoryTools } from "./domains/category.tools";
import { DebtTools } from "./domains/debt.tools";
import { GoalTools } from "./domains/goal.tools";
import { InsightTools } from "./domains/insight.tools";
import { PositionTools } from "./domains/position.tools";
import { ProfileTools } from "./domains/profile.tools";
import { TransactionTools } from "./domains/transaction.tools";
import { parseToolArgs } from "./tool-input";
import type { ToolDefinition, ToolResult } from "./tool.types";

const DESTRUCTIVE = "destructive";

@Injectable()
export class ToolRegistry {
  private readonly definitions: Map<string, ToolDefinition>;

  constructor(
    accounts: AccountTools,
    categories: CategoryTools,
    transactions: TransactionTools,
    budgets: BudgetTools,
    assets: AssetTools,
    debts: DebtTools,
    positions: PositionTools,
    goals: GoalTools,
    profile: ProfileTools,
    insights: InsightTools,
  ) {
    const grouped: Array<[string, ToolDefinition[]]> = [
      ["Cuentas", accounts.definitions()],
      ["Categorías", categories.definitions()],
      ["Movimientos", transactions.definitions()],
      ["Presupuestos", budgets.definitions()],
      ["Activos y valuaciones", assets.definitions()],
      ["Deudas", debts.definitions()],
      ["Inversiones", positions.definitions()],
      ["Metas", goals.definitions()],
      ["Perfil", profile.definitions()],
      ["Análisis y mercado", insights.definitions()],
    ];
    const definitions = grouped.flatMap(([group, items]) =>
      items.map((item) => ({ ...item, group })),
    );

    this.definitions = new Map();
    for (const definition of definitions) {
      if (this.definitions.has(definition.name)) {
        throw new Error(`Duplicate assistant tool: ${definition.name}`);
      }
      this.definitions.set(definition.name, definition);
    }
  }

  /**
   * Catálogo legible de tools disponibles agrupadas por dominio, para inyectar
   * en el prompt y dar al modelo un índice organizado del catálogo.
   */
  catalog(user: User): string {
    const groups = new Map<string, ToolDefinition[]>();
    for (const definition of this.list(user)) {
      const group = definition.group ?? "General";
      groups.set(group, [...(groups.get(group) ?? []), definition]);
    }
    return [...groups.entries()]
      .map(
        ([group, items]) =>
          `- ${group}: ${items
            .map((item) => `${item.name} (${item.title})`)
            .join(", ")}`,
      )
      .join("\n");
  }

  toAiTools(user: User): AiTool[] {
    return this.list(user).map((definition) => ({
      type: "function",
      function: {
        name: definition.name,
        description: definition.description,
        parameters: definition.parameters,
      },
    }));
  }

  get(name: string): ToolDefinition | undefined {
    return this.definitions.get(name);
  }

  async executeRead(userId: string, call: AiToolCall): Promise<ToolResult> {
    const definition = this.definitions.get(call.function.name);
    if (!definition) {
      throw new ApiException(
        ErrorCode.ACTION_NOT_ALLOWED,
        HttpStatus.BAD_REQUEST,
        "La acción solicitada no está disponible.",
      );
    }
    const result = await definition.execute(userId, parseToolArgs(call));
    return {
      toolCallId: call.id,
      name: definition.name,
      mutates: false,
      ...result,
    };
  }

  private list(user: User): ToolDefinition[] {
    return [...this.definitions.values()].filter(
      (definition) =>
        definition.classification !== DESTRUCTIVE ||
        user.assistantDestructiveEnabled,
    );
  }
}

export type ActionClass = "read" | "write_safe" | "sensitive" | "destructive";

export type AssistantActionStatus =
  "proposed" | "executed" | "failed" | "cancelled" | "expired";

export interface AssistantActionEntity {
  id: string;
  name: string;
  type?: string;
  currency?: string;
  initialBalance?: number;
}

export interface ActionPreviewField {
  label: string;
  value: string;
}

export interface ActionPreview {
  title: string;
  summary: string;
  fields: ActionPreviewField[];
  impact?: string;
}

export interface ToolHandlerResult {
  ok: boolean;
  summary: string;
  data?: unknown;
  entity?: AssistantActionEntity | null;
}

export interface ToolResult extends ToolHandlerResult {
  toolCallId: string;
  name: string;
  mutates: boolean;
}

export interface PreparedAction {
  args: Record<string, unknown>;
  preview: ActionPreview;
  summary: string;
  /**
   * Nombre legible de la entidad que esta acción crea (si aplica). Permite
   * que acciones posteriores del mismo plan referencien una entidad que
   * todavía no existe sin tratarlo como un error (forward reference).
   */
  createdEntityName?: string;
}

export interface ToolDefinition {
  name: string;
  title: string;
  /** Dominio al que pertenece la tool (para el catálogo del modelo). */
  group?: string;
  description: string;
  classification: ActionClass;
  parameters: Record<string, unknown>;
  execute(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<ToolHandlerResult>;
  prepare?(
    userId: string,
    args: Record<string, unknown>,
  ): Promise<PreparedAction>;
}

export interface ActionProposal {
  actionId: string;
  token: string;
  name: string;
  title: string;
  classification: ActionClass;
  destructive: boolean;
  summary: string;
  preview: ActionPreview;
  expiresAt: string;
  planId: string | null;
  step: number;
  pending: boolean;
}

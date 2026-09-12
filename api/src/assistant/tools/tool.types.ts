export interface AssistantActionEntity {
  id: string;
  name: string;
  type?: string;
  currency?: string;
  initialBalance?: number;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  ok: boolean;
  mutates: boolean;
  summary: string;
  data?: unknown;
  entity?: AssistantActionEntity | null;
}

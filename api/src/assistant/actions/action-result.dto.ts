import { AssistantActionEntity } from "../tools/tool.types";
import type { ActionClass } from "../tools/tool.types";

export class ActionResultDto {
  actionId: string;
  name: string;
  title: string;
  classification: ActionClass;
  status: "executed" | "failed" | "cancelled";
  summary: string;
  entity: AssistantActionEntity | null;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

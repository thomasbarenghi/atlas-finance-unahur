export class ConversationResponse {
  id: string;
  question: string;
  answer: string;
  contextMeta: Record<string, unknown>;
  createdAt: string;
}

export class PaginatedConversationsDto {
  items: ConversationResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

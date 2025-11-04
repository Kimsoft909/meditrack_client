export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id?: string;
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: string;
}

export interface StreamEvent {
  type: 'token' | 'error' | 'done';
  content?: string;
  conversation_id?: string;
}

export interface ChatHistoryParams {
  limit?: number;
  conversation_id?: string;
}

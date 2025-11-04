import { API_ENDPOINTS } from '@/config/api';
import { httpClient } from './httpClient';
import { tokenStorage } from './tokenStorage';
import { logger } from '@/utils/logger';
import type { ChatMessage, ChatMessageRequest, StreamEvent, ChatHistoryParams } from '@/types/chat';

export const chatService = {
  // Stream chat response using SSE
  async streamMessage(
    request: ChatMessageRequest,
    onToken: (content: string) => void,
    onDone: (conversationId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      logger.debug('Starting SSE stream for chat message');

      const response = await fetch(API_ENDPOINTS.chat.send, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event: StreamEvent = JSON.parse(data);

            if (event.type === 'token' && event.content) {
              onToken(event.content);
            } else if (event.type === 'error' && event.content) {
              onError(event.content);
              break;
            } else if (event.type === 'done') {
              onDone(event.conversation_id || '');
              break;
            }
          } catch (parseError) {
            logger.error('Failed to parse SSE event', parseError);
          }
        }
      }

      logger.debug('SSE stream completed');
    } catch (error: any) {
      logger.error('Chat streaming failed', error);
      onError(error.message || 'Failed to send message');
      throw error;
    }
  },

  // Get chat history
  async getHistory(params: ChatHistoryParams = {}): Promise<ChatMessage[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.conversation_id) queryParams.append('conversation_id', params.conversation_id);

    const url = `${API_ENDPOINTS.chat.history}?${queryParams.toString()}`;
    return httpClient.get<ChatMessage[]>(url, true);
  },

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.chat.deleteConversation(conversationId), true);
  },
};

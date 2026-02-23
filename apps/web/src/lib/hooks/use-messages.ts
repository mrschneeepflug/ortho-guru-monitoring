'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { MessageThread, Message, ApiResponse } from '../types';

export function useThreads() {
  return useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<MessageThread[]>>('/messaging/threads');
      return data.data;
    },
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: ['threads', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<MessageThread & { messages: Message[] }>>(`/messaging/threads/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { threadId: string; content: string }) => {
      const { data } = await apiClient.post<ApiResponse<Message>>('/messaging/messages', msg);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['threads'] }),
  });
}

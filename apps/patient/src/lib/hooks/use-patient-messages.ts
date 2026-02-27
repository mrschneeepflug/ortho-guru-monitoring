'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse, MessageThread, Message } from '../types';

export function usePatientThreads() {
  return useQuery({
    queryKey: ['patient-threads'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<MessageThread[]>>('/patient/messages');
      return data.data;
    },
  });
}

export function usePatientThread(threadId: string) {
  return useQuery({
    queryKey: ['patient-thread', threadId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ id: string; subject: string; messages: Message[] }>>(
        `/patient/messages/${threadId}`,
      );
      return data.data;
    },
    enabled: !!threadId,
  });
}

export function useSendPatientMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const { data } = await apiClient.post<ApiResponse<Message>>('/patient/messages', {
        threadId,
        content,
      });
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient-thread', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['patient-threads'] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await apiClient.patch<ApiResponse<Message>>(
        `/patient/messages/${messageId}/read`,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-threads'] });
    },
  });
}

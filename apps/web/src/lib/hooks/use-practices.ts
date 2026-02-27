'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { Practice, ApiResponse } from '../types';

export function usePractice(id: string) {
  return useQuery({
    queryKey: ['practices', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Practice>>(`/practices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdatePractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; address?: string; phone?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Practice>>(`/practices/${id}`, updates);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['practices'] }),
  });
}

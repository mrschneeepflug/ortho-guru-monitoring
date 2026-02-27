'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { TagSet, TagAnalytics, ApiResponse } from '../types';

export function useSessionTags(sessionId: string) {
  return useQuery({
    queryKey: ['tags', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<TagSet>>(`/tagging/sessions/${sessionId}/tags`);
      return data.data;
    },
    enabled: !!sessionId,
  });
}

export function useSubmitTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, ...tags }: Partial<TagSet> & { sessionId: string }) => {
      const { data } = await apiClient.post<ApiResponse<TagSet>>(`/tagging/sessions/${sessionId}/tags`, tags);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export interface AiSuggestion {
  overallTracking: number;
  alignerFit: number;
  oralHygiene: number;
  detailTags: string[];
  actionTaken: string | null;
  notes: string | null;
  confidence: number;
}

export function useAiSuggest() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.post<ApiResponse<AiSuggestion>>(
        `/tagging/sessions/${sessionId}/suggest`,
      );
      return data.data;
    },
  });
}

export function useTagAnalytics() {
  return useQuery({
    queryKey: ['tagging', 'analytics'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<TagAnalytics>>('/tagging/analytics');
      return data.data;
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ScanSession, PaginatedResponse, ApiResponse } from '../types';

export function useScans(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['scans', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<ScanSession>>>('/scans/sessions', { params });
      return data.data;
    },
  });
}

export function useScan(id: string) {
  return useQuery({
    queryKey: ['scans', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ScanSession>>(`/scans/sessions/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateScanSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patientId: string) => {
      const { data } = await apiClient.post<ApiResponse<ScanSession>>('/scans/sessions', { patientId });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scans'] }),
  });
}

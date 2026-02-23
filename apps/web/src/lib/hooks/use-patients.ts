'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { Patient, PaginatedResponse, ApiResponse } from '../types';

export function usePatients(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Patient>>>('/patients', { params });
      return data.data;
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patient: Partial<Patient>) => {
      const { data } = await apiClient.post<ApiResponse<Patient>>('/patients', patient);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Patient> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Patient>>(`/patients/${id}`, updates);
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });
}

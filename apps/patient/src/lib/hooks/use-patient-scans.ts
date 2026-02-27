'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse, ScanSession } from '../types';

export function usePatientScans() {
  return useQuery({
    queryKey: ['patient-scans'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ScanSession[]>>('/patient/scans');
      return data.data;
    },
  });
}

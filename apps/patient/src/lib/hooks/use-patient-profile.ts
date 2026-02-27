'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse, PatientProfile } from '../types';

export function usePatientProfile() {
  return useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PatientProfile>>('/patient/profile');
      return data.data;
    },
  });
}

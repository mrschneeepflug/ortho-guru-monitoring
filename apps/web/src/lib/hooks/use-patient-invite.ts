'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse } from '../types';

interface InviteResponse {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export function useInvitePatient() {
  return useMutation({
    mutationFn: async ({ patientId, email }: { patientId: string; email?: string }) => {
      const { data } = await apiClient.post<ApiResponse<InviteResponse>>(
        `/patients/${patientId}/invite`,
        { email },
      );
      return data.data;
    },
  });
}

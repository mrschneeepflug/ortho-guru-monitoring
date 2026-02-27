'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse, ScanSession, ScanImage } from '../types';

type ImageType = ScanImage['imageType'];

interface UploadUrlResponse {
  url: string;
  key: string;
}

export function useCreateScanSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<ScanSession>>('/patient/scans/sessions');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-scans'] });
    },
  });
}

export function useUploadScanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      imageType,
      file,
    }: {
      sessionId: string;
      imageType: ImageType;
      file: File;
    }) => {
      // 1. Get pre-signed upload URL
      const { data: urlResp } = await apiClient.post<ApiResponse<UploadUrlResponse>>(
        '/patient/scans/upload-url',
        { sessionId, imageType },
      );
      const { url, key } = urlResp.data;

      // 2. Check if cloud or local
      const isCloudUrl = url.startsWith('http');

      if (isCloudUrl) {
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'image/jpeg' },
        });

        const { data: confirmResp } = await apiClient.post<ApiResponse<ScanImage>>(
          '/patient/scans/upload/confirm',
          { sessionId, imageType, key },
        );
        return confirmResp.data;
      }

      // Fallback: multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('imageType', imageType);

      const { data: uploadResp } = await apiClient.post<ApiResponse<ScanImage>>(
        '/patient/scans/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return uploadResp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-scans'] });
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { ApiResponse, ScanImage } from '../types';

type ImageType = ScanImage['imageType'];

interface UploadUrlResponse {
  url: string;
  key: string;
}

/**
 * Hook for uploading scan images via pre-signed URL (direct-to-storage).
 * Falls back to multipart upload when the API returns a local path.
 */
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
      // 1. Get pre-signed upload URL from API
      const { data: urlResp } = await apiClient.post<ApiResponse<UploadUrlResponse>>(
        '/scans/upload/upload-url',
        { sessionId, imageType },
      );
      const { url, key } = urlResp.data;

      // 2. Check if this is a cloud URL or local fallback
      const isCloudUrl = url.startsWith('http');

      if (isCloudUrl) {
        // Direct upload to OCI/S3 via pre-signed PUT URL
        await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'image/jpeg' },
        });

        // 3. Confirm upload with API to create the ScanImage record
        const { data: confirmResp } = await apiClient.post<ApiResponse<ScanImage>>(
          '/scans/upload/confirm',
          { sessionId, imageType, key },
        );
        return confirmResp.data;
      }

      // Fallback: multipart upload through API server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('imageType', imageType);

      const { data: uploadResp } = await apiClient.post<ApiResponse<ScanImage>>(
        '/scans/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return uploadResp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

/**
 * Get a pre-signed download URL for a scan image.
 */
export async function fetchImageUrl(imageId: string): Promise<string | null> {
  const { data } = await apiClient.get<ApiResponse<{ url: string | null }>>(
    `/scans/images/${imageId}/url`,
  );
  return data.data.url;
}

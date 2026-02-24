'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api-client';
import type { DashboardSummary, ComplianceStats, FeedItem, ApiResponse } from '../types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
      return data.data;
    },
  });
}

export function useDashboardFeed() {
  return useQuery({
    queryKey: ['dashboard', 'feed'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FeedItem[]>>('/dashboard/feed');
      return data.data;
    },
  });
}

export function useComplianceStats() {
  return useQuery({
    queryKey: ['dashboard', 'compliance'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ComplianceStats>>('/dashboard/compliance');
      return data.data;
    },
  });
}

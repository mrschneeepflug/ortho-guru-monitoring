import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardSummary, useDashboardFeed, useComplianceStats } from '../use-dashboard';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { server } from '../../../test/msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useDashboardSummary', () => {
  it('should fetch dashboard summary', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDashboardSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty('pendingScans');
    expect(result.current.data).toHaveProperty('totalPatients');
    expect(result.current.data).toHaveProperty('compliancePercentage');
    expect(result.current.data).toHaveProperty('taggingRate');
  });
});

describe('useDashboardFeed', () => {
  it('should fetch activity feed', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDashboardFeed(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useComplianceStats', () => {
  it('should fetch compliance statistics', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useComplianceStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty('totalActive');
    expect(result.current.data).toHaveProperty('onTimeCount');
    expect(result.current.data).toHaveProperty('overdueCount');
    expect(result.current.data).toHaveProperty('compliancePercentage');
    expect(result.current.data).toHaveProperty('overduePatients');
  });
});

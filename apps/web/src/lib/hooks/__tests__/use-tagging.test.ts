import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionTags, useSubmitTags, useTagAnalytics } from '../use-tagging';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { server } from '../../../test/msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useSessionTags', () => {
  it('should fetch tags for a session', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSessionTags('s1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('overallTracking');
  });

  it('should not fetch when sessionId is empty', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSessionTags(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSubmitTags', () => {
  it('should submit tags and invalidate both tags and scans caches', async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubmitTags(), { wrapper });

    result.current.mutate({ sessionId: 's1', overallTracking: 1, oralHygiene: 1 } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tags'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scans'] });
  });
});

describe('useTagAnalytics', () => {
  it('should fetch tagging analytics', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useTagAnalytics(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('taggingRate');
    expect(result.current.data).toHaveProperty('discountPercent');
  });
});

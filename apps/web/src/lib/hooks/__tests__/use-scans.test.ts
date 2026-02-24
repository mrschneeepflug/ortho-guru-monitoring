import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useScans, useScan, useCreateScanSession } from '../use-scans';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { server } from '../../../test/msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useScans', () => {
  it('should fetch scan sessions', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useScans(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('items');
  });

  it('should pass filter params', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useScans({ status: 'PENDING', patientId: 'p1' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useScan', () => {
  it('should fetch a single scan session', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useScan('s1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('id');
  });

  it('should not fetch when id is empty (conditional enable)', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useScan(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateScanSession', () => {
  it('should create session and invalidate scans cache', async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateScanSession(), { wrapper });

    result.current.mutate('p1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scans'] });
  });
});

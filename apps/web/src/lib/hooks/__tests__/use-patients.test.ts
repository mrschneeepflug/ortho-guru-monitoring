import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatients, usePatient, useCreatePatient, useUpdatePatient } from '../use-patients';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { server } from '../../../test/msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('usePatients', () => {
  it('should fetch patients list', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePatients(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveProperty('items');
    expect(result.current.data).toHaveProperty('total');
  });

  it('should pass query params', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => usePatients({ page: 2, status: 'ACTIVE' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('usePatient', () => {
  it('should fetch a single patient', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePatient('p1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('id');
  });

  it('should not fetch when id is empty', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePatient(''), { wrapper });

    // Should stay in idle/disabled state
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreatePatient', () => {
  it('should create a patient and invalidate cache', async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreatePatient(), { wrapper });

    result.current.mutate({ name: 'New Patient' } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['patients'] });
  });
});

describe('useUpdatePatient', () => {
  it('should update a patient and invalidate cache', async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdatePatient(), { wrapper });

    result.current.mutate({ id: 'p1', name: 'Updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['patients'] });
  });
});

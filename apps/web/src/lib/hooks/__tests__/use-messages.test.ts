import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useThreads, useThread, useSendMessage } from '../use-messages';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { server } from '../../../test/msw-server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useThreads', () => {
  it('should fetch all threads', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useThreads(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});

describe('useThread', () => {
  it('should fetch a single thread with messages', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useThread('th1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('subject');
    expect(result.current.data).toHaveProperty('messages');
  });

  it('should not fetch when id is empty', async () => {
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useThread(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSendMessage', () => {
  it('should send message and invalidate threads cache', async () => {
    const { wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    result.current.mutate({ threadId: 'th1', content: 'Hello' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['threads'] });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api-client before importing auth
vi.mock('../api-client', () => ({
  default: {
    post: vi.fn(),
  },
}));

import apiClient from '../api-client';
import { login, logout, getToken, getUser, isAuthenticated } from '../auth';

describe('auth utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should store token and user in localStorage', async () => {
      const mockResponse = {
        data: {
          data: {
            accessToken: 'jwt-token-123',
            user: { id: 'u1', email: 'doc@test.com', name: 'Dr Test', role: 'DOCTOR', practiceId: 'p1' },
          },
        },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const user = await login({ email: 'doc@test.com', password: 'pass' });

      expect(localStorage.getItem('ortho_token')).toBe('jwt-token-123');
      expect(JSON.parse(localStorage.getItem('ortho_user')!)).toEqual(mockResponse.data.data.user);
      expect(user.id).toBe('u1');
    });

    it('should call POST /auth/login', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { data: { accessToken: 'tok', user: { id: 'u1' } } },
      });

      await login({ email: 'a@b.com', password: '123' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: '123' });
    });
  });

  describe('logout', () => {
    it('should clear localStorage', () => {
      localStorage.setItem('ortho_token', 'token');
      localStorage.setItem('ortho_user', '{"id":"u1"}');

      // Mock window.location.href setter
      const locationMock = { href: '' };
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true,
      });

      logout();

      expect(localStorage.getItem('ortho_token')).toBeNull();
      expect(localStorage.getItem('ortho_user')).toBeNull();
    });

    it('should redirect to /login', () => {
      const locationMock = { href: '' };
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true,
      });

      logout();

      expect(window.location.href).toBe('/login');
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('ortho_token', 'my-token');
      expect(getToken()).toBe('my-token');
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { id: 'u1', email: 'a@b.com', name: 'Dr', role: 'DOCTOR', practiceId: 'p1' };
      localStorage.setItem('ortho_user', JSON.stringify(user));

      expect(getUser()).toEqual(user);
    });

    it('should return null when no user stored', () => {
      expect(getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('ortho_token', 'token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });
});

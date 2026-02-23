import apiClient from './api-client';

const TOKEN_KEY = 'ortho_token';
const USER_KEY = 'ortho_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  practiceId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  const { accessToken, user } = data.data;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user as AuthUser;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

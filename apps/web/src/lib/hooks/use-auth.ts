'use client';

import { useState, useEffect } from 'react';
import { AuthUser, getUser, isAuthenticated, login as authLogin, logout as authLogout } from '../auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authLogin({ email, password });
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return { user, loading, isAuthenticated: isAuthenticated(), login, logout };
}

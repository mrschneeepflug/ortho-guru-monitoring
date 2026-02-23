'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthUser, getUser, isAuthenticated as checkAuth, login as authLogin, logout as authLogout } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authLogin({ email, password });
    setUser(u);
    return u;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: checkAuth(), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}

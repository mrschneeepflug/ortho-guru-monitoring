'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  AuthUser,
  getUser,
  login as authLogin,
  logout as authLogout,
  setAuth,
} from '@/lib/auth';
import apiClient from '@/lib/api-client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithAuth0: () => void;
  logout: () => void;
  auth0Enabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth0Enabled = !!process.env.NEXT_PUBLIC_AUTH0_DOMAIN;

function LocalAuthProvider({ children }: { children: ReactNode }) {
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

  const loginWithAuth0 = () => {
    // No-op when Auth0 is not enabled
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !loading && !!user, login, loginWithAuth0, logout, auth0Enabled: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function Auth0AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [Auth0Provider, setAuth0Provider] = useState<React.ComponentType<{
    children: ReactNode;
    domain: string;
    clientId: string;
    authorizationParams: { audience?: string; redirect_uri?: string };
    onRedirectCallback?: (appState?: { returnTo?: string }) => void;
  }> | null>(null);
  const [useAuth0Hook, setUseAuth0Hook] = useState<(() => {
    isAuthenticated: boolean;
    isLoading: boolean;
    user?: { email?: string; name?: string; sub?: string };
    getAccessTokenSilently: () => Promise<string>;
    loginWithRedirect: (opts?: { appState?: { returnTo?: string } }) => Promise<void>;
    logout: (opts?: { logoutParams?: { returnTo?: string } }) => void;
  }) | null>(null);

  // Dynamically import Auth0 to avoid errors when not configured
  useEffect(() => {
    import('@auth0/auth0-react').then((mod) => {
      setAuth0Provider(() => mod.Auth0Provider);
      setUseAuth0Hook(() => mod.useAuth0);
    });
  }, []);

  if (!Auth0Provider || !useAuth0Hook) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          loading: true,
          isAuthenticated: false,
          login: async () => { throw new Error('Loading Auth0...'); },
          loginWithAuth0: () => {},
          logout: () => {},
          auth0Enabled: true,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
      }}
    >
      <Auth0Inner useAuth0={useAuth0Hook}>{children}</Auth0Inner>
    </Auth0Provider>
  );
}

function Auth0Inner({
  children,
  useAuth0,
}: {
  children: ReactNode;
  useAuth0: () => {
    isAuthenticated: boolean;
    isLoading: boolean;
    user?: { email?: string; name?: string; sub?: string };
    getAccessTokenSilently: () => Promise<string>;
    loginWithRedirect: (opts?: { appState?: { returnTo?: string } }) => Promise<void>;
    logout: (opts?: { logoutParams?: { returnTo?: string } }) => void;
  };
}) {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Auth0 state with our app's auth state
  useEffect(() => {
    if (auth0IsLoading) return;

    if (auth0IsAuthenticated && auth0User) {
      // Get the Auth0 token and fetch our user profile
      getAccessTokenSilently()
        .then(async (token) => {
          setAuth(token, getUser() || {} as AuthUser); // temp store token for api-client interceptor
          const { data } = await apiClient.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const me = data.data;
          const appUser: AuthUser = {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role,
            practiceId: me.practiceId,
          };
          setAuth(token, appUser);
          setUser(appUser);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      // Check for existing local session
      const existingUser = getUser();
      setUser(existingUser);
      setLoading(false);
    }
  }, [auth0IsAuthenticated, auth0IsLoading, auth0User, getAccessTokenSilently]);

  // Local email/password login still works in dual mode
  const login = async (email: string, password: string) => {
    const u = await authLogin({ email, password });
    setUser(u);
    return u;
  };

  const loginWithAuth0Fn = useCallback(() => {
    loginWithRedirect({ appState: { returnTo: '/dashboard' } });
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    if (auth0IsAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }, [auth0IsAuthenticated, auth0Logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !loading && !!user,
        login,
        loginWithAuth0: loginWithAuth0Fn,
        logout,
        auth0Enabled: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (auth0Enabled) {
    return <Auth0AuthProvider>{children}</Auth0AuthProvider>;
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}

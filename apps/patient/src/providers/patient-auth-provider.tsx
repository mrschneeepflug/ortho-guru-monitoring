'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import apiClient from '@/lib/api-client';
import type { AuthResponse } from '@/lib/types';

interface PatientAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: AuthResponse['patient'] | null;
  login: (email: string, password: string) => Promise<void>;
  register: (token: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const PatientAuthContext = createContext<PatientAuthState | null>(null);

const PUBLIC_PATHS = ['/login', '/register'];

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<AuthResponse['patient'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    const stored = localStorage.getItem('patient_data');

    if (token && stored) {
      try {
        setPatient(JSON.parse(stored));
      } catch {
        localStorage.removeItem('patient_token');
        localStorage.removeItem('patient_data');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !patient && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/login');
    }
  }, [isLoading, patient, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/patient-auth/login', {
      email,
      password,
    });
    const result = data.data;
    localStorage.setItem('patient_token', result.accessToken);
    localStorage.setItem('patient_data', JSON.stringify(result.patient));
    setPatient(result.patient);
    router.replace('/home');
  }, [router]);

  const register = useCallback(async (token: string, email: string, password: string) => {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/patient-auth/register', {
      token,
      email,
      password,
    });
    const result = data.data;
    localStorage.setItem('patient_token', result.accessToken);
    localStorage.setItem('patient_data', JSON.stringify(result.patient));
    setPatient(result.patient);
    router.replace('/home');
  }, [router]);

  const logout = useCallback(async () => {
    // Best-effort server-side logout to revoke refresh token family
    try {
      await axios.post(
        `${apiClient.defaults.baseURL}/patient-auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch {
      // Ignore — clear local state regardless
    }
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_data');
    setPatient(null);
    router.replace('/login');
  }, [router]);

  return (
    <PatientAuthContext.Provider
      value={{
        isAuthenticated: !!patient,
        isLoading,
        patient,
        login,
        register,
        logout,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error('usePatientAuth must be used within PatientAuthProvider');
  return ctx;
}

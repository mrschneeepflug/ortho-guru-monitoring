'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientAuth } from '@/providers/patient-auth-provider';

export default function RootPage() {
  const { isAuthenticated, isLoading } = usePatientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? '/home' : '/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-medical-blue font-semibold">Loading...</div>
    </div>
  );
}

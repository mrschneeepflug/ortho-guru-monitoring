'use client';

import { usePatientAuth } from '@/providers/patient-auth-provider';
import { PatientHeader } from '@/components/layout/patient-header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = usePatientAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-medical-blue font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-20">
      <PatientHeader />
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

'use client';

import { LogOut } from 'lucide-react';
import { usePatientAuth } from '@/providers/patient-auth-provider';

export function PatientHeader() {
  const { patient, logout } = usePatientAuth();

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo-bissig.jpg" alt="bissig Kieferorthopädie" className="h-8 w-auto" />
          {patient && <p className="text-xs text-gray-500">{patient.name}</p>}
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

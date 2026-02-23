'use client';

import { useRouter } from 'next/navigation';
import { PatientForm } from '@/components/patients/patient-form';
import { useCreatePatient } from '@/lib/hooks/use-patients';

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();

  const handleSubmit = async (data: Record<string, unknown>) => {
    await createPatient.mutateAsync(data as Parameters<typeof createPatient.mutateAsync>[0]);
    router.push('/patients');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Patient</h1>
      <div className="max-w-2xl">
        <PatientForm onSubmit={handleSubmit} loading={createPatient.isPending} />
      </div>
    </div>
  );
}

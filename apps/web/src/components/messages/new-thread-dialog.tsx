'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/lib/hooks/use-patients';
import { useCreateThread } from '@/lib/hooks/use-messages';

interface NewThreadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewThreadDialog({ open, onClose }: NewThreadDialogProps) {
  const router = useRouter();
  const { data: patientsData } = usePatients({ limit: 100 });
  const createThread = useCreateThread();

  const [patientId, setPatientId] = useState('');
  const [subject, setSubject] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const thread = await createThread.mutateAsync({ patientId, subject });
    onClose();
    setPatientId('');
    setSubject('');
    router.push(`/messages/${thread.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">New Message Thread</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
          >
            <option value="">Select a patient...</option>
            {patientsData?.items.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Message subject..."
            required
          />
        </div>

        {createThread.isError && (
          <p className="text-sm text-red-600">Failed to create thread. Please try again.</p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createThread.isPending}>
            {createThread.isPending ? 'Creating...' : 'Create Thread'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

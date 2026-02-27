'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PatientFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

export function PatientForm({ onSubmit, loading }: PatientFormProps) {
  const [form, setForm] = useState({
    name: '',
    doctorId: '',
    treatmentType: '',
    alignerBrand: '',
    totalStages: '',
    scanFrequency: '14',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      doctorId: form.doctorId,
      treatmentType: form.treatmentType || undefined,
      alignerBrand: form.alignerBrand || undefined,
      totalStages: form.totalStages ? parseInt(form.totalStages) : undefined,
      scanFrequency: parseInt(form.scanFrequency),
    });
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
        <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID *</label>
        <Input value={form.doctorId} onChange={(e) => update('doctorId', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type</label>
          <Input value={form.treatmentType} onChange={(e) => update('treatmentType', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aligner Brand</label>
          <Input value={form.alignerBrand} onChange={(e) => update('alignerBrand', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Stages</label>
          <Input type="number" value={form.totalStages} onChange={(e) => update('totalStages', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scan Frequency (days)</label>
          <Input type="number" value={form.scanFrequency} onChange={(e) => update('scanFrequency', e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Patient'}
      </Button>
    </form>
  );
}

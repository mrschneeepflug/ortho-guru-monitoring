'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePatients } from '@/lib/hooks/use-patients';
import { PatientTable } from '@/components/patients/patient-table';

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePatients({ search: search || undefined, status: status || undefined, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link
          href="/patients/new"
          className="px-4 py-2 bg-medical-blue text-white rounded-lg hover:bg-medical-dark transition-colors text-center"
        >
          Add Patient
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
          <option value="DROPPED">Dropped</option>
        </select>
      </div>

      <PatientTable
        patients={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={data?.limit ?? 20}
        onPageChange={setPage}
      />
    </div>
  );
}

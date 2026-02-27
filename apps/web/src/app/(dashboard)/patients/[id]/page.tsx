'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { usePatient } from '@/lib/hooks/use-patients';
import { useScans } from '@/lib/hooks/use-scans';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { InvitePatientDialog } from '@/components/patients/invite-patient-dialog';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading } = usePatient(id);
  const { data: scans } = useScans({ patientId: id, page: 1, limit: 10 });
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-48 bg-gray-200 rounded" /></div>;
  }

  if (!patient) return <p className="text-gray-500">Patient not found</p>;

  const patientScans = scans?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <Badge className={STATUS_COLORS[patient.status]}>{STATUS_LABELS[patient.status]}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite to Portal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Patient Info</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Treatment</dt><dd>{patient.treatmentType ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Aligner Brand</dt><dd>{patient.alignerBrand ?? 'N/A'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Stage</dt><dd>{patient.currentStage}/{patient.totalStages ?? '?'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Scan Frequency</dt><dd>Every {patient.scanFrequency} days</dd></div>
            {patient.dateOfBirth && <div className="flex justify-between"><dt className="text-gray-500">Date of Birth</dt><dd>{formatDate(patient.dateOfBirth)}</dd></div>}
          </dl>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Scan History</h2>
          {patientScans.length === 0 ? (
            <p className="text-gray-500 text-sm">No scans yet</p>
          ) : (
            <div className="space-y-2">
              {patientScans.map((scan) => (
                <Link key={scan.id} href={`/scans/${scan.id}`} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <span className="text-sm">{formatRelativeTime(scan.createdAt)}</span>
                  <Badge className={STATUS_COLORS[scan.status]}>{STATUS_LABELS[scan.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <InvitePatientDialog
        patientId={id}
        patientName={patient.name}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}

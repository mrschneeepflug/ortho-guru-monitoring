import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import type { Patient } from '@/lib/types';

interface PatientTableProps {
  patients: Patient[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function PatientTable({ patients, loading, total, page, limit, onPageChange }: PatientTableProps) {
  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Treatment</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Frequency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <Link href={`/patients/${patient.id}`} className="text-medical-blue hover:underline font-medium">
                  {patient.name}
                </Link>
              </TableCell>
              <TableCell>{patient.treatmentType ?? 'N/A'}</TableCell>
              <TableCell>{patient.currentStage}/{patient.totalStages ?? '?'}</TableCell>
              <TableCell><Badge className={STATUS_COLORS[patient.status]}>{STATUS_LABELS[patient.status]}</Badge></TableCell>
              <TableCell>Every {patient.scanFrequency}d</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <p className="text-sm text-gray-500">{total} patients total</p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

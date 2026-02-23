'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useScans } from '@/lib/hooks/use-scans';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';

export default function ScansPage() {
  const [status, setStatus] = useState<string>('');
  const { data, isLoading } = useScans({ status: status || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scan Sessions</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((scan) => (
            <Link key={scan.id} href={`/scans/${scan.id}`} className="block">
              <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{scan.patient?.name ?? 'Unknown Patient'}</p>
                    <p className="text-sm text-gray-500">{scan.imageCount} images &middot; {formatRelativeTime(scan.createdAt)}</p>
                  </div>
                  <Badge className={STATUS_COLORS[scan.status]}>{STATUS_LABELS[scan.status]}</Badge>
                </div>
              </div>
            </Link>
          )) ?? <p className="text-gray-500">No scan sessions found</p>}
        </div>
      )}
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import { useScan } from '@/lib/hooks/use-scans';
import { ScanImageViewer } from '@/components/scans/scan-image-viewer';
import { TaggingPanel } from '@/components/scans/tagging-panel';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: scan, isLoading } = useScan(id);

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /></div>;
  }

  if (!scan) {
    return <p className="text-gray-500">Scan session not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{scan.patient?.name}</h1>
          <p className="text-gray-500">{formatDateTime(scan.createdAt)}</p>
        </div>
        <Badge className={STATUS_COLORS[scan.status]}>{STATUS_LABELS[scan.status]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScanImageViewer images={scan.images ?? []} />
        </div>
        <div>
          <TaggingPanel sessionId={scan.id} existingTags={scan.tagSet} />
        </div>
      </div>
    </div>
  );
}

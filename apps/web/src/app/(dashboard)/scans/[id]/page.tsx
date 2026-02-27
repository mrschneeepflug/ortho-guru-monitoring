'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useScan } from '@/lib/hooks/use-scans';
import { ScanImageViewer } from '@/components/scans/scan-image-viewer';
import { TaggingPanel } from '@/components/scans/tagging-panel';
import { UploadImageDialog } from '@/components/scans/upload-image-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: scan, isLoading } = useScan(id);
  const [uploadOpen, setUploadOpen] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded" /></div>;
  }

  if (!scan) {
    return <p className="text-gray-500">Scan session not found</p>;
  }

  const existingImageTypes = (scan.images ?? []).map((img) => img.imageType);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{scan.patient?.name}</h1>
          <p className="text-gray-500">{formatDateTime(scan.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            Upload Image
          </Button>
          <Badge className={STATUS_COLORS[scan.status]}>{STATUS_LABELS[scan.status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScanImageViewer images={scan.images ?? []} />
        </div>
        <div>
          <TaggingPanel sessionId={scan.id} existingTags={scan.tagSet} />
        </div>
      </div>

      <UploadImageDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        sessionId={scan.id}
        existingImageTypes={existingImageTypes}
      />
    </div>
  );
}

'use client';

import { ScanWizard } from '@/components/scan/scan-wizard';

export default function ScanPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Take Scan Photos</h2>
      <ScanWizard />
    </div>
  );
}

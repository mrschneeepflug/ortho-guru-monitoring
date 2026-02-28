'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TAG_COLORS, TAG_LABELS } from '@/lib/constants';
import { ATTACHMENT_CHECK_LABELS } from 'shared';
import type { ScanSession } from '@/lib/types';

interface PatientReportCardProps {
  session: ScanSession;
}

export function PatientReportCard({ session }: PatientReportCardProps) {
  const [expanded, setExpanded] = useState(true);

  const hasReport = session.reportTrayNumber != null
    || session.reportAlignerFit != null
    || session.reportAttachments != null;

  if (!hasReport) return null;

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold">Patient Self-Report</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <CardContent className="space-y-3">
          {/* Tray Number */}
          {session.reportTrayNumber != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tray Number</span>
              <span className="text-sm font-medium">#{session.reportTrayNumber}</span>
            </div>
          )}

          {/* Aligner Fit */}
          {session.reportAlignerFit != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Aligner Fit</span>
              <Badge className={TAG_COLORS[session.reportAlignerFit]}>
                {TAG_LABELS[session.reportAlignerFit]}
              </Badge>
            </div>
          )}

          {/* Wear Time */}
          {session.reportWearTimeHrs != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Wear Time</span>
              <span className="text-sm font-medium">{session.reportWearTimeHrs} hrs/day</span>
            </div>
          )}

          {/* Attachments */}
          {session.reportAttachments != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Attachments</span>
              <span className="text-sm font-medium">
                {ATTACHMENT_CHECK_LABELS[session.reportAttachments]}
              </span>
            </div>
          )}

          {/* Notes */}
          {session.reportNotes && (
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Patient Notes</span>
              <p className="text-sm bg-gray-50 rounded-lg p-3 text-gray-700">
                {session.reportNotes}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

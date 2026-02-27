'use client';

import Link from 'next/link';
import { Camera, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientProfile } from '@/lib/hooks/use-patient-profile';
import { usePatientScans } from '@/lib/hooks/use-patient-scans';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

export default function HomePage() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: scans, isLoading: scansLoading } = usePatientScans();

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const progressPercent = profile.totalStages
    ? Math.round((profile.currentStage / profile.totalStages) * 100)
    : 0;

  const recentScans = scans?.slice(0, 5) ?? [];
  const isOverdue = profile.nextScanDue && new Date(profile.nextScanDue) < new Date();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        Hi, {profile.name.split(' ')[0]}!
      </h2>

      {/* Treatment Progress */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-medical-blue" />
            <h3 className="font-semibold text-sm">Treatment Progress</h3>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Stage {profile.currentStage} of {profile.totalStages ?? '?'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-medical-blue h-2.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{profile.treatmentType ?? 'Treatment'}</span>
            {profile.alignerBrand && <span>{profile.alignerBrand}</span>}
          </div>
          <p className="text-xs text-gray-500">
            Doctor: {profile.doctorName}
          </p>
        </CardContent>
      </Card>

      {/* Next Scan Due */}
      <Card className={isOverdue ? 'ring-2 ring-red-200' : ''}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-100' : 'bg-medical-blue/10'}`}>
                <Calendar className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-medical-blue'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isOverdue ? 'Scan Overdue!' : 'Next Scan Due'}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.nextScanDue
                    ? formatDate(profile.nextScanDue)
                    : 'No scans yet — take your first one!'}
                </p>
              </div>
            </div>
            <Link href="/scan">
              <Button size="sm">
                <Camera className="w-4 h-4 mr-1" /> Scan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Recent Scans</h3>
          {recentScans.map((scan) => (
            <Card key={scan.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{formatRelativeTime(scan.createdAt)}</p>
                  <p className="text-xs text-gray-500">{scan.imageCount} photos</p>
                </div>
                <Badge className={STATUS_COLORS[scan.status]}>
                  {STATUS_LABELS[scan.status]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

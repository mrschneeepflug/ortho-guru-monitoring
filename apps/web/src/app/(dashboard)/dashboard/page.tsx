'use client';

import { useDashboardSummary, useDashboardFeed } from '@/lib/hooks/use-dashboard';
import { useTagAnalytics } from '@/lib/hooks/use-tagging';
import { ScanFeedCard } from '@/components/dashboard/scan-feed-card';
import { TaggingRateWidget } from '@/components/dashboard/tagging-rate-widget';

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: feed, isLoading: feedLoading } = useDashboardFeed();
  const { data: tagging } = useTagAnalytics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm animate-pulse h-24" />
          ))
        ) : (
          <>
            <StatCard label="Pending Scans" value={summary?.pendingScans ?? 0} />
            <StatCard label="Total Patients" value={summary?.totalPatients ?? 0} />
            <StatCard label="Compliance" value={`${summary?.compliancePercentage?.toFixed(1) ?? 0}%`} />
            <StatCard label="Tagging Rate" value={`${summary?.taggingRate?.toFixed(1) ?? 0}%`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {feedLoading ? (
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-48" />
          ) : (
            <div className="space-y-3">
              {feed?.map((item) => (
                <ScanFeedCard key={item.id} item={item} />
              )) ?? <p className="text-gray-500">No recent activity</p>}
            </div>
          )}
        </div>

        {/* Tagging Rate Widget */}
        <div>
          {tagging && <TaggingRateWidget analytics={tagging} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

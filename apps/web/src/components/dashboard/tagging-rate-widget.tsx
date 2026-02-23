import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TagAnalytics {
  taggingRate: number;
  discountPercent: number;
  totalSessions: number;
  taggedSessions: number;
  period: string;
}

export function TaggingRateWidget({ analytics }: { analytics: TagAnalytics }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Tagging Rate</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-medical-blue">{analytics.taggingRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 mt-1">Last {analytics.period}</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-medical-blue rounded-full h-2 transition-all"
            style={{ width: `${Math.min(analytics.taggingRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{analytics.taggedSessions}/{analytics.totalSessions} sessions</span>
          <span className="font-medium text-green-600">{analytics.discountPercent}% discount</span>
        </div>
      </CardContent>
    </Card>
  );
}

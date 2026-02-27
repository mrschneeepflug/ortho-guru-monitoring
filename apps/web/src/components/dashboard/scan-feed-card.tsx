import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';

interface FeedItem {
  id: string;
  type: string;
  date: string;
  data: Record<string, unknown>;
}

export function ScanFeedCard({ item }: { item: FeedItem }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium capitalize">{item.type}</p>
          <p className="text-xs text-gray-500">{formatRelativeTime(item.date)}</p>
        </div>
        {typeof item.data.status === 'string' && (
          <Badge className={STATUS_COLORS[item.data.status] ?? 'bg-gray-100 text-gray-800'}>
            {STATUS_LABELS[item.data.status] ?? item.data.status}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

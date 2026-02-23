import { TAG_LABELS, TAG_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TagChipsProps {
  overallTracking: number;
  alignerFit: number | null;
  oralHygiene: number;
}

export function TagChips({ overallTracking, alignerFit, oralHygiene }: TagChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={cn('px-2 py-1 rounded text-xs font-medium', TAG_COLORS[overallTracking])}>
        Tracking: {TAG_LABELS[overallTracking]}
      </span>
      {alignerFit !== null && (
        <span className={cn('px-2 py-1 rounded text-xs font-medium', TAG_COLORS[alignerFit])}>
          Fit: {TAG_LABELS[alignerFit]}
        </span>
      )}
      <span className={cn('px-2 py-1 rounded text-xs font-medium', TAG_COLORS[oralHygiene])}>
        Hygiene: {TAG_LABELS[oralHygiene]}
      </span>
    </div>
  );
}

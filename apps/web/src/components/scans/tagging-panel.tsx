'use client';

import { useState } from 'react';
import { useSubmitTags } from '@/lib/hooks/use-tagging';
import { TAG_LABELS, TAG_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TagSet {
  overallTracking: number;
  alignerFit: number | null;
  oralHygiene: number;
  notes: string | null;
}

export function TaggingPanel({ sessionId, existingTags }: { sessionId: string; existingTags?: TagSet | null }) {
  const submitTags = useSubmitTags();
  const [tracking, setTracking] = useState(existingTags?.overallTracking ?? 1);
  const [fit, setFit] = useState(existingTags?.alignerFit ?? 1);
  const [hygiene, setHygiene] = useState(existingTags?.oralHygiene ?? 1);
  const [notes, setNotes] = useState(existingTags?.notes ?? '');

  const handleSubmit = async () => {
    await submitTags.mutateAsync({
      sessionId,
      overallTracking: tracking,
      alignerFit: fit,
      oralHygiene: hygiene,
      notes: notes || undefined,
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
      <h3 className="font-semibold">Clinical Tags</h3>

      <TagToggle label="Overall Tracking" value={tracking} onChange={setTracking} />
      <TagToggle label="Aligner Fit" value={fit} onChange={setFit} />
      <TagToggle label="Oral Hygiene" value={hygiene} onChange={setHygiene} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-20"
          placeholder="Clinical observations..."
        />
      </div>

      <Button onClick={handleSubmit} disabled={submitTags.isPending} className="w-full">
        {existingTags ? 'Update Tags' : 'Submit Tags'}
      </Button>
    </div>
  );
}

function TagToggle({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              value === v ? TAG_COLORS[v] : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {TAG_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

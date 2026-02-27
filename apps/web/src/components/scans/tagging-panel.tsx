'use client';

import { useState, useRef } from 'react';
import { useSubmitTags, useAiSuggest } from '@/lib/hooks/use-tagging';
import type { AiSuggestion } from '@/lib/hooks/use-tagging';
import { TAG_LABELS, TAG_COLORS, DETAIL_TAG_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TagSet {
  overallTracking: number;
  alignerFit: number | null;
  oralHygiene: number;
  detailTags: string[];
  actionTaken: string | null;
  notes: string | null;
}

export function TaggingPanel({ sessionId, existingTags }: { sessionId: string; existingTags?: TagSet | null }) {
  const submitTags = useSubmitTags();
  const aiSuggest = useAiSuggest();
  const [tracking, setTracking] = useState(existingTags?.overallTracking ?? 1);
  const [fit, setFit] = useState(existingTags?.alignerFit ?? 1);
  const [hygiene, setHygiene] = useState(existingTags?.oralHygiene ?? 1);
  const [notes, setNotes] = useState(existingTags?.notes ?? '');
  const [detailTags, setDetailTags] = useState<string[]>(existingTags?.detailTags ?? []);
  const [actionTaken, setActionTaken] = useState(existingTags?.actionTaken ?? '');
  const [aiWasUsed, setAiWasUsed] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiSnapshot = useRef<AiSuggestion | null>(null);

  const toggleDetailTag = (tag: string) => {
    setDetailTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAiSuggest = async () => {
    setAiError(null);
    try {
      const suggestion = await aiSuggest.mutateAsync(sessionId);
      setTracking(suggestion.overallTracking);
      setFit(suggestion.alignerFit);
      setHygiene(suggestion.oralHygiene);
      setDetailTags(suggestion.detailTags);
      setActionTaken(suggestion.actionTaken ?? '');
      setNotes(suggestion.notes ?? '');
      setAiWasUsed(true);
      aiSnapshot.current = suggestion;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 501) {
        setAiError('AI suggestions are not configured on this server.');
      } else {
        setAiError('Failed to get AI suggestions. Please try again.');
      }
    }
  };

  const hasAiBeenOverridden = (): boolean => {
    if (!aiSnapshot.current) return false;
    const s = aiSnapshot.current;
    return (
      tracking !== s.overallTracking ||
      fit !== s.alignerFit ||
      hygiene !== s.oralHygiene ||
      (actionTaken || null) !== s.actionTaken ||
      (notes || null) !== s.notes ||
      detailTags.length !== s.detailTags.length ||
      detailTags.some((t) => !s.detailTags.includes(t))
    );
  };

  const handleSubmit = async () => {
    await submitTags.mutateAsync({
      sessionId,
      overallTracking: tracking,
      alignerFit: fit,
      oralHygiene: hygiene,
      notes: notes || undefined,
      detailTags,
      actionTaken: actionTaken || undefined,
      aiSuggested: aiWasUsed,
      aiOverridden: aiWasUsed ? hasAiBeenOverridden() : false,
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Clinical Tags</h3>
          {aiWasUsed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              AI Suggested
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAiSuggest}
          disabled={aiSuggest.isPending}
        >
          {aiSuggest.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            'Get AI Suggestion'
          )}
        </Button>
      </div>

      {aiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {aiError}
        </div>
      )}

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Detail Tags</label>
        <div className="flex flex-wrap gap-2">
          {DETAIL_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDetailTag(tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                detailTags.includes(tag)
                  ? 'bg-medical-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label>
        <Input
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          placeholder="e.g., Restarted aligner stage, prescribed retainer..."
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

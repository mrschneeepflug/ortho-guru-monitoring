'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export interface QuestionnaireData {
  trayNumber: number | null;
  alignerFit: number | null; // 1=Good, 2=Fair, 3=Poor
  wearTimeHrs: number | null;
  attachmentCheck: 'YES' | 'NO' | 'UNSURE' | null;
  notes: string;
}

export const INITIAL_QUESTIONNAIRE: QuestionnaireData = {
  trayNumber: null,
  alignerFit: null,
  wearTimeHrs: null,
  attachmentCheck: null,
  notes: '',
};

interface ScanQuestionnaireProps {
  data: QuestionnaireData;
  onChange: (data: QuestionnaireData) => void;
  onNext: () => void;
  onBack: () => void;
}

const FIT_OPTIONS = [
  { value: 1, label: 'Good', color: 'bg-green-500 text-white', ring: 'ring-green-500' },
  { value: 2, label: 'Fair', color: 'bg-yellow-400 text-black', ring: 'ring-yellow-400' },
  { value: 3, label: 'Poor', color: 'bg-red-500 text-white', ring: 'ring-red-500' },
] as const;

const ATTACHMENT_OPTIONS = [
  { value: 'YES' as const, label: 'Yes' },
  { value: 'NO' as const, label: 'No' },
  { value: 'UNSURE' as const, label: 'Unsure' },
];

export function ScanQuestionnaire({ data, onChange, onNext, onBack }: ScanQuestionnaireProps) {
  const update = (partial: Partial<QuestionnaireData>) => {
    onChange({ ...data, ...partial });
  };

  const showWearTime = data.alignerFit === 2 || data.alignerFit === 3;
  const canProceed = data.trayNumber !== null && data.trayNumber >= 1
    && data.alignerFit !== null
    && data.attachmentCheck !== null;

  return (
    <Card>
      <CardContent className="py-6 space-y-6">
        <h2 className="text-lg font-semibold text-center">Quick Check-In</h2>
        <p className="text-sm text-gray-500 text-center">
          Answer a few questions before taking your photos.
        </p>

        {/* 1. Tray Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Which tray are you currently wearing? <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 8"
            value={data.trayNumber ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
              update({ trayNumber: val });
            }}
          />
        </div>

        {/* 2. Aligner Fit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            How does your aligner fit? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {FIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const partial: Partial<QuestionnaireData> = { alignerFit: opt.value };
                  // Clear wear time when switching back to Good
                  if (opt.value === 1) partial.wearTimeHrs = null;
                  update(partial);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  data.alignerFit === opt.value
                    ? `${opt.color} ring-2 ${opt.ring} ring-offset-2`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Wear Time (conditional) */}
        {showWearTime && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              How many hours per day are you wearing your aligners?
            </label>
            <Input
              type="number"
              min={0}
              max={24}
              placeholder="e.g. 20"
              value={data.wearTimeHrs ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                update({ wearTimeHrs: val });
              }}
            />
          </div>
        )}

        {/* 4. Attachments */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Are all your attachments still in place? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {ATTACHMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ attachmentCheck: opt.value })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  data.attachmentCheck === opt.value
                    ? 'bg-medical-blue text-white ring-2 ring-medical-blue ring-offset-2'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Anything else you'd like your doctor to know?
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors resize-none"
            rows={3}
            maxLength={1000}
            placeholder="Optional notes..."
            value={data.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button className="flex-1" disabled={!canProceed} onClick={onNext}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

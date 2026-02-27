'use client';

import { Camera } from 'lucide-react';
import { ANGLE_INSTRUCTIONS, IMAGE_TYPE_LABELS } from '@/lib/constants';

interface AnglePromptProps {
  imageType: string;
  stepNumber: number;
  totalSteps: number;
}

export function AnglePrompt({ imageType, stepNumber, totalSteps }: AnglePromptProps) {
  const instruction = ANGLE_INSTRUCTIONS[imageType];

  return (
    <div className="text-center space-y-4">
      <div className="text-sm text-gray-500">
        Photo {stepNumber} of {totalSteps}
      </div>
      <div className="w-20 h-20 rounded-full bg-medical-blue/10 flex items-center justify-center mx-auto">
        <Camera className="w-10 h-10 text-medical-blue" />
      </div>
      <h3 className="text-lg font-semibold">{instruction?.title || IMAGE_TYPE_LABELS[imageType]}</h3>
      <p className="text-sm text-gray-600 max-w-xs mx-auto">
        {instruction?.description || 'Take a clear photo of this angle.'}
      </p>
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  preview: string | null;
  onRetake: () => void;
}

export function CameraCapture({ onCapture, preview, onRetake }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
        </div>
        <Button variant="outline" className="w-full" onClick={onRetake}>
          <RotateCcw className="w-4 h-4 mr-2" /> Retake Photo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-medical-blue hover:bg-medical-blue/5 transition-colors"
      >
        <Camera className="w-12 h-12 text-gray-400" />
        <span className="text-sm text-gray-500">Tap to take photo</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

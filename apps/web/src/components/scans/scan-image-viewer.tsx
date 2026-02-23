'use client';

import { useState } from 'react';
import { IMAGE_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ScanImage {
  id: string;
  imageType: string;
  localPath: string | null;
  s3Key: string | null;
  qualityScore: number | null;
}

export function ScanImageViewer({ images }: { images: ScanImage[] }) {
  const [selected, setSelected] = useState<string | null>(images[0]?.id ?? null);

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
        No images uploaded yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Main viewer */}
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Image preview placeholder</p>
      </div>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-5 gap-2 p-4">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setSelected(img.id)}
            className={cn(
              'aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 transition-colors',
              selected === img.id ? 'border-medical-blue' : 'border-transparent hover:border-gray-300',
            )}
          >
            {IMAGE_TYPE_LABELS[img.imageType] ?? img.imageType}
          </button>
        ))}
      </div>
    </div>
  );
}

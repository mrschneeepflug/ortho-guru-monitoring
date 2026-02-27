'use client';

import { useState, useEffect } from 'react';
import { IMAGE_TYPE_LABELS } from '@/lib/constants';
import { fetchImageUrl, fetchThumbnailUrl } from '@/lib/hooks/use-upload';
import { cn } from '@/lib/utils';

interface ScanImage {
  id: string;
  imageType: string;
  localPath: string | null;
  s3Key: string | null;
  thumbnailKey: string | null;
  qualityScore: number | null;
}

export function ScanImageViewer({ images }: { images: ScanImage[] }) {
  const [selected, setSelected] = useState<string | null>(images[0]?.id ?? null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedImage = images.find((img) => img.id === selected);
  const hasStoredImage = selectedImage?.s3Key || selectedImage?.localPath;

  // Eagerly fetch thumbnail URLs for all images that have a thumbnailKey
  useEffect(() => {
    let cancelled = false;
    const toFetch = images.filter((img) => img.thumbnailKey && !thumbnailUrls[img.id]);
    if (toFetch.length === 0) return;

    Promise.allSettled(
      toFetch.map(async (img) => {
        const url = await fetchThumbnailUrl(img.id);
        if (!cancelled && url) {
          setThumbnailUrls((prev) => ({ ...prev, [img.id]: url }));
        }
      }),
    );

    return () => { cancelled = true; };
  }, [images, thumbnailUrls]);

  // Fetch full-size image URL for the selected image
  useEffect(() => {
    if (!selected || imageUrls[selected]) return;

    const image = images.find((img) => img.id === selected);
    if (!image?.s3Key && !image?.localPath) return;

    let cancelled = false;
    setLoading(true);

    fetchImageUrl(selected)
      .then((url) => {
        if (!cancelled && url) {
          setImageUrls((prev) => ({ ...prev, [selected]: url }));
        }
      })
      .catch(() => {/* ignore fetch errors */})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected, images, imageUrls]);

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
        {loading ? (
          <p className="text-gray-400">Loading image...</p>
        ) : imageUrls[selected!] ? (
          <img
            src={imageUrls[selected!]}
            alt={selectedImage ? (IMAGE_TYPE_LABELS[selectedImage.imageType] ?? selectedImage.imageType) : 'Scan image'}
            className="max-h-full max-w-full object-contain"
          />
        ) : hasStoredImage ? (
          <p className="text-gray-400">Unable to load image</p>
        ) : (
          <p className="text-gray-400">Image preview placeholder</p>
        )}
      </div>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-3 sm:p-4">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setSelected(img.id)}
            className={cn(
              'aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 border-2 transition-colors overflow-hidden',
              selected === img.id ? 'border-medical-blue' : 'border-transparent hover:border-gray-300',
            )}
          >
            {thumbnailUrls[img.id] || imageUrls[img.id] ? (
              <img
                src={thumbnailUrls[img.id] || imageUrls[img.id]}
                alt={IMAGE_TYPE_LABELS[img.imageType] ?? img.imageType}
                className="w-full h-full object-cover"
              />
            ) : (
              IMAGE_TYPE_LABELS[img.imageType] ?? img.imageType
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

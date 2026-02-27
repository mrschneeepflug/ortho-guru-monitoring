'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useUploadScanImage } from '@/lib/hooks/use-upload';
import { IMAGE_TYPE_LABELS } from '@/lib/constants';

type ImageType = 'FRONT' | 'LEFT' | 'RIGHT' | 'UPPER_OCCLUSAL' | 'LOWER_OCCLUSAL';

const ALL_IMAGE_TYPES: ImageType[] = [
  'FRONT',
  'LEFT',
  'RIGHT',
  'UPPER_OCCLUSAL',
  'LOWER_OCCLUSAL',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadImageDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  existingImageTypes: string[];
}

export function UploadImageDialog({
  open,
  onClose,
  sessionId,
  existingImageTypes,
}: UploadImageDialogProps) {
  const [imageType, setImageType] = useState<ImageType>('FRONT');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadScanImage();

  const resetState = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const validateAndSetFile = useCallback((selected: File) => {
    setError(null);

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('File size must be under 10MB');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSetFile(selected);
    },
    [validateAndSetFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile],
  );

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setError(null);

    try {
      await uploadMutation.mutateAsync({ sessionId, imageType, file });
      handleClose();
    } catch {
      setError('Upload failed. Please try again.');
    }
  }, [file, sessionId, imageType, uploadMutation, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose}>
      <h2 className="text-lg font-semibold mb-4">Upload Scan Image</h2>

      <div className="space-y-4">
        {/* Image type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image Type
          </label>
          <Select
            value={imageType}
            onChange={(e) => setImageType(e.target.value as ImageType)}
            className="w-full"
          >
            {ALL_IMAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {IMAGE_TYPE_LABELS[type]}
                {existingImageTypes.includes(type) ? ' (uploaded)' : ''}
              </option>
            ))}
          </Select>
        </div>

        {/* Drop zone / file input */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-medical-blue bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-48 rounded object-contain"
            />
          ) : (
            <div className="text-gray-500">
              <p className="font-medium">Click or drag an image here</p>
              <p className="text-xs mt-1">JPEG, PNG, WebP — max 10MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && (
          <p className="text-sm text-gray-500">
            {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

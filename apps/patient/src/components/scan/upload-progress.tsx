'use client';

interface UploadProgressProps {
  current: number;
  total: number;
  label?: string;
}

export function UploadProgress({ current, total, label }: UploadProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-gray-600 text-center">{label}</p>}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-medical-blue h-3 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center">
        {current} of {total} photos uploaded ({percent}%)
      </p>
    </div>
  );
}

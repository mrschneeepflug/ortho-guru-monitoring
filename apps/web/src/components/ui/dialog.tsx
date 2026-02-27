'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-3 sm:mx-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto', className)}>
        {children}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      {...props}
    />
  );
}

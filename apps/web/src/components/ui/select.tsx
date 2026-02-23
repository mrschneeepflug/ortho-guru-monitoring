import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white',
          className,
        )}
        {...props}
      />
    );
  },
);
Select.displayName = 'Select';
export { Select };

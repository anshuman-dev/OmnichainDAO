import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm' | 'lg';
}

export function Spinner({ className, size = 'default', ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        size === 'default' && 'h-6 w-6',
        size === 'sm' && 'h-4 w-4',
        size === 'lg' && 'h-8 w-8',
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}
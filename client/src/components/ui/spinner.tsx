import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'default' | 'lg' | 'xl';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  default: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

const variantClasses: Record<string, string> = {
  default: 'border-current opacity-25',
  primary: 'border-primary opacity-25',
  secondary: 'border-secondary opacity-25',
  accent: 'border-blue-500 opacity-25',
};

export function Spinner({ 
  size = 'default', 
  variant = 'default',
  className,
  ...props 
}: SpinnerProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-t-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
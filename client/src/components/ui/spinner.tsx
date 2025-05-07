import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'accent';
}

export function Spinner({
  size = 'md',
  color = 'default',
  className,
  ...props
}: SpinnerProps) {
  // Size mapping
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  // Color mapping
  const colorMap = {
    default: 'text-gray-400',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-blue-500',
  };

  return (
    <div 
      role="status" 
      className={cn("animate-spin", className)} 
      {...props}
    >
      <Loader2 className={cn(sizeMap[size], colorMap[color])} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
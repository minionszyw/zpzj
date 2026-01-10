import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'underline' | 'outline';
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'underline', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent py-2 text-sm placeholder:text-ink-300 focus:outline-none transition-colors',
          // Variants
          variant === 'underline' && 'border-b border-ink-200 focus:border-brand-accent px-0 rounded-none',
          variant === 'outline' && 'border border-ink-200 rounded-md px-3 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent',
          // Error state
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

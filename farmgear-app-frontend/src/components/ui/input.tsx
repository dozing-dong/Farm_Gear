import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

// Input variant definitions
const inputVariants = cva(
  'flex w-full rounded-xl border bg-white px-4 py-3 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-neutral-200 focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:border-primary-500',
        error:
          'border-error-500 focus-visible:ring-2 focus-visible:ring-error-500/20 focus-visible:border-error-500',
        success:
          'border-success-500 focus-visible:ring-2 focus-visible:ring-success-500/20 focus-visible:border-success-500',
      },
      inputSize: {
        sm: 'h-9 px-3 py-2 text-xs',
        default: 'h-12 px-4 py-3 text-sm',
        lg: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

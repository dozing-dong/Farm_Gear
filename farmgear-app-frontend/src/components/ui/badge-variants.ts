import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
        success: 'border-transparent bg-success-500 text-white hover:bg-success-600',
        warning: 'border-transparent bg-warning-500 text-white hover:bg-warning-600',
        error: 'border-transparent bg-error-500 text-white hover:bg-error-600',
        info: 'border-transparent bg-info-500 text-white hover:bg-info-600',
        outline: 'border-neutral-200 text-neutral-900 hover:bg-neutral-50',
        ghost: 'border-transparent text-neutral-600 hover:bg-neutral-100',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

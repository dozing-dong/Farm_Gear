import { cva } from 'class-variance-authority';

// Card container variants
export const cardVariants = cva(
  'rounded-xl border bg-white text-neutral-900 shadow-soft transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-neutral-200/50',
        elevated: 'border-neutral-200/50 shadow-medium',
        outlined: 'border-neutral-300 shadow-none',
        ghost: 'border-transparent shadow-none bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-medium hover:-translate-y-1',
        glow: 'hover:shadow-large hover:shadow-primary-500/10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      hover: 'none',
    },
  }
);

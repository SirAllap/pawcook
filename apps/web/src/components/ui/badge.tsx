import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badge = cva(
  [
    'inline-flex items-center gap-1.5 px-2.5 py-1',
    'text-[11px] font-bold tracking-wide rounded-full border whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        neutral:  'bg-surface-2 text-muted-fg border-border',
        primary:  'bg-primary/15 text-primary border-primary/25',
        success:  'bg-success/15 text-success border-success/25',
        warning:  'bg-warning/15 text-warning border-warning/30',
        danger:   'bg-danger/15 text-danger border-danger/25',
        info:     'bg-info/15 text-info border-info/25',
        outline:  'bg-transparent text-foreground border-border',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...rest }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...rest} />;
}

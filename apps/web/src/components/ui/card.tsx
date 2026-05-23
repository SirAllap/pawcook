import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const card = cva(
  ['rounded-2xl transition-colors'],
  {
    variants: {
      variant: {
        surface: 'bg-surface text-surface-fg border border-border/70 shadow-sm',
        muted:   'bg-surface-2 text-foreground border border-border/50',
        ghost:   'bg-transparent border border-border/40',
        glow:    'bg-surface text-surface-fg border border-primary/30 shadow-glow',
        elevated:'bg-surface text-surface-fg border border-border/60 shadow-lg',
      },
      padding: {
        none: '',
        sm:   'p-4',
        md:   'p-5',
        lg:   'p-7',
      },
    },
    defaultVariants: { variant: 'surface', padding: 'md' },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, padding, ...rest },
  ref
) {
  return <div ref={ref} className={cn(card({ variant, padding }), className)} {...rest} />;
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1', className)} {...rest} />;
}
export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-bold tracking-tight', className)} {...rest} />;
}
export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-fg', className)} {...rest} />;
}

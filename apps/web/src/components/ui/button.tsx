import { forwardRef, type ButtonHTMLAttributes, type ReactElement, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Slot } from '../../lib/slot';

const button = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-semibold tracking-tight select-none',
    'transition-[background,color,box-shadow,transform] duration-200',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-fg shadow-md',
          'hover:bg-primary-hover hover:shadow-lg',
          'shadow-primary/20',
        ],
        secondary: [
          'bg-surface-2 text-foreground border border-border',
          'hover:bg-surface-3',
        ],
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-surface-2',
        ],
        outline: [
          'border border-border bg-transparent text-foreground',
          'hover:bg-surface-2',
        ],
        destructive: [
          'bg-danger text-danger-fg shadow-md hover:opacity-90',
        ],
        glow: [
          'bg-primary text-primary-fg shadow-glow',
          'hover:bg-primary-hover',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-lg',
        md: 'h-11 px-5 text-sm rounded-xl',
        lg: 'h-14 px-7 text-base rounded-2xl',
        xl: 'h-16 px-8 text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
  /**
   * When true, render the styled element as the single child instead of a
   * native <button>. Use this to apply button styling to a <Link> or <a>
   * without producing illegal nested interactive elements.
   */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    block,
    loading,
    disabled,
    asChild,
    type,
    children,
    ...rest
  },
  ref
) {
  const cls = cn(button({ variant, size, block }), className);
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      {children}
    </>
  );

  if (asChild) {
    // Strip button-only props that don't apply to an arbitrary element.
    return (
      <Slot
        ref={ref as Ref<unknown>}
        className={cls}
        aria-disabled={disabled || loading || undefined}
        data-loading={loading || undefined}
        {...(rest as Record<string, unknown>)}
      >
        {content as unknown as ReactElement}
      </Slot>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={cls}
      {...rest}
    >
      {content}
    </button>
  );
});

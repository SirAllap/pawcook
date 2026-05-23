import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, helper, error, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error || undefined}
          className={cn(
            'w-full appearance-none cursor-pointer rounded-xl border border-input bg-surface',
            'pl-4 pr-10 py-3 text-base text-foreground outline-none',
            'transition-[border-color,background-color] duration-200',
            'focus:border-primary/60',
            error && 'border-danger/60',
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg" />
      </div>
      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted-fg">{helper}</p>
      ) : null}
    </div>
  );
});

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  helper?: ReactNode;
  error?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, helper, error, leading, trailing, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]"
        >
          {label}
        </label>
      )}
      <div className={cn(
        'group relative flex items-center rounded-xl border border-input bg-surface',
        'transition-[border-color,background-color,box-shadow] duration-200',
        'focus-within:border-primary/60 focus-within:bg-surface',
        error && 'border-danger/60'
      )}>
        {leading && <span className="pl-3 text-muted-fg shrink-0">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          className={cn(
            'flex-1 bg-transparent px-4 py-3 text-base text-foreground',
            'placeholder:text-muted-fg/70 outline-none rounded-xl',
            'min-w-0',
            leading && 'pl-2',
            trailing && 'pr-2',
            className
          )}
          {...rest}
        />
        {trailing && <span className="pr-3 text-muted-fg shrink-0">{trailing}</span>}
      </div>
      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted-fg">{helper}</p>
      ) : null}
    </div>
  );
});

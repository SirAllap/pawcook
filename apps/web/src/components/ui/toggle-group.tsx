import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as TG from '@radix-ui/react-toggle-group';
import { cn } from '../../lib/cn';

export const ToggleGroup = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TG.Root>
>(function ToggleGroup({ className, ...rest }, ref) {
  return (
    <TG.Root
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-surface-2 p-1 border border-border/60',
        className
      )}
      {...rest}
    />
  );
});

export const ToggleGroupItem = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof TG.Item>
>(function ToggleGroupItem({ className, ...rest }, ref) {
  return (
    <TG.Item
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5',
        'text-sm font-semibold text-muted-fg transition-all duration-200',
        'data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm',
        'hover:text-foreground active:scale-[0.96]',
        className
      )}
      {...rest}
    />
  );
});

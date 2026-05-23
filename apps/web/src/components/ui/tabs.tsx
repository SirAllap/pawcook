import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as RT from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn';

export const Tabs = RT.Root;

export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RT.List>
>(function TabsList({ className, ...rest }, ref) {
  return (
    <RT.List
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-surface-2 p-1 border border-border/60',
        className
      )}
      {...rest}
    />
  );
});

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RT.Trigger>
>(function TabsTrigger({ className, ...rest }, ref) {
  return (
    <RT.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold',
        'text-muted-fg transition-all duration-200 outline-none',
        'data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'hover:text-foreground',
        className
      )}
      {...rest}
    />
  );
});

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RT.Content>
>(function TabsContent({ className, ...rest }, ref) {
  return (
    <RT.Content
      ref={ref}
      className={cn('outline-none focus-visible:outline-none', className)}
      {...rest}
    />
  );
});

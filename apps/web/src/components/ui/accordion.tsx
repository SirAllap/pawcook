import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as RA from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Accordion = RA.Root;

export const AccordionItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RA.Item>
>(function AccordionItem({ className, ...rest }, ref) {
  return (
    <RA.Item ref={ref} className={cn('border-b border-border last:border-none', className)} {...rest} />
  );
});

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RA.Trigger>
>(function AccordionTrigger({ className, children, ...rest }, ref) {
  return (
    <RA.Header className="flex">
      <RA.Trigger
        ref={ref}
        className={cn(
          'group flex flex-1 items-center justify-between gap-3 py-3.5 text-left font-semibold',
          'transition-colors hover:text-primary',
          className
        )}
        {...rest}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-fg transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </RA.Trigger>
    </RA.Header>
  );
});

export const AccordionContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RA.Content>
>(function AccordionContent({ className, children, ...rest }, ref) {
  return (
    <RA.Content
      ref={ref}
      className={cn(
        'overflow-hidden text-sm text-muted-fg',
        'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
        className
      )}
      {...rest}
    >
      <div className="pb-4">{children}</div>
    </RA.Content>
  );
});

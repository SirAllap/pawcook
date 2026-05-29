import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import * as RS from '@radix-ui/react-switch';
import { cn } from '../../lib/cn';

export const Switch = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RS.Root>
>(function Switch({ className, ...rest }, ref) {
  return (
    <RS.Root
      ref={ref}
      className={cn(
        // h-6 keeps the visual switch 24px tall; the before-pseudo extends the
        // pointer/touch hit-area to a 44px-tall target (WCAG 2.5.5) without
        // disturbing layout.
        'peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border border-transparent transition-colors',
        "before:absolute before:inset-x-0 before:-top-2.5 before:-bottom-2.5 before:content-['']",
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-surface-3',
        className
      )}
      {...rest}
    >
      <RS.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-surface shadow-md ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5" />
    </RS.Root>
  );
});

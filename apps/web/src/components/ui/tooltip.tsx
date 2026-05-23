import { type ReactNode } from 'react';
import * as RT from '@radix-ui/react-tooltip';
import { cn } from '../../lib/cn';

export const TooltipProvider = RT.Provider;

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 200,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}) {
  return (
    <RT.Root delayDuration={delay}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-[80] max-w-xs rounded-lg border border-border bg-surface px-2.5 py-1.5',
            'text-xs font-medium text-foreground shadow-lg',
            'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
            'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0'
          )}
        >
          {content}
          <RT.Arrow className="fill-border" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}

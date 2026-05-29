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
            // z-[100] keeps tooltips above the Sheet (overlay z-80 / content
            // z-90) so help text inside a drawer isn't clipped behind it.
            'z-[100] max-w-xs rounded-lg border border-border bg-surface px-2.5 py-1.5',
            'text-xs font-medium text-foreground shadow-lg',
            'origin-[var(--radix-tooltip-content-transform-origin)]',
            'data-[state=delayed-open]:anim-pop-in data-[state=closed]:anim-pop-out'
          )}
        >
          {content}
          <RT.Arrow className="fill-border" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}

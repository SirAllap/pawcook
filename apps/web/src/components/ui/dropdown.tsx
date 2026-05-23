import { type ReactNode } from 'react';
import * as RD from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn';

export const Dropdown = RD.Root;
export const DropdownTrigger = RD.Trigger;

export function DropdownContent({
  className,
  align = 'end',
  sideOffset = 8,
  children,
}: {
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  children: ReactNode;
}) {
  return (
    <RD.Portal>
      <RD.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-[70] min-w-[10rem] overflow-hidden rounded-2xl border border-border bg-surface text-surface-fg shadow-xl',
          'p-1 outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
      >
        {children}
      </RD.Content>
    </RD.Portal>
  );
}

export function DropdownItem({
  className,
  active,
  ...rest
}: RD.DropdownMenuItemProps & { active?: boolean }) {
  return (
    <RD.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium outline-none',
        'transition-colors',
        'data-[highlighted]:bg-surface-2 data-[highlighted]:text-foreground',
        active && 'text-primary',
        className
      )}
      {...rest}
    />
  );
}

export function DropdownSeparator() {
  return <RD.Separator className="my-1 h-px bg-border" />;
}

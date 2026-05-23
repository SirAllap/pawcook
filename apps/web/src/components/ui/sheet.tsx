import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '../../lib/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[90] mt-24 flex flex-col rounded-t-[28px]',
            'bg-surface text-surface-fg border-t border-border shadow-xl',
            'max-h-[90dvh] outline-none',
            className
          )}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <div className="mx-auto mt-3 mb-2 h-1.5 w-10 rounded-full bg-border" aria-hidden />
          {(title || description) && (
            <div className="px-5 pt-2 pb-4 text-center">
              {title && (
                <Drawer.Title className="text-lg font-bold tracking-tight">{title}</Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="text-sm text-muted-fg mt-1">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}
          <div className="overflow-y-auto px-4 pb-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

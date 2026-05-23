import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-[10px] font-black text-primary uppercase tracking-[0.16em] whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'primary' | 'muted' | 'info' | 'warning' | 'success' | 'danger';

const TONE: Record<Tone, string> = {
  primary: 'text-primary',
  muted:   'text-muted-fg',
  info:    'text-info',
  warning: 'text-warning',
  success: 'text-success',
  danger:  'text-danger',
};

/**
 * Tiny, bold uppercase label that opens a section card or a hero.
 * Centralises the `text-[10px] font-black uppercase tracking-[0.2em]`
 * pattern repeated 20+ times across the codebase with slightly drifting
 * tracking values (0.16em / 0.18em / 0.2em). One primitive, one tracking
 * value, one place to tune the brand voice.
 */
export function Eyebrow({
  children,
  tone = 'primary',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', TONE[tone], className)}>
      {children}
    </p>
  );
}

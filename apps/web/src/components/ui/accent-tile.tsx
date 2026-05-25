import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Accent = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const ACCENT: Record<Accent, string> = {
  primary: 'bg-primary/10 text-primary',
  info:    'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger:  'bg-danger/10 text-danger',
  accent:  'bg-accent/15 text-accent',
};

const SIZE: Record<Size, { wrap: string; icon: string; radius: string }> = {
  sm: { wrap: 'h-8 w-8',  icon: 'h-4 w-4',   radius: 'rounded-lg' },
  md: { wrap: 'h-10 w-10', icon: 'h-5 w-5',   radius: 'rounded-xl' },
  lg: { wrap: 'h-12 w-12', icon: 'h-6 w-6',   radius: 'rounded-2xl' },
};

/**
 * Colored icon tile used to open list-row cards, section eyebrows,
 * tab triggers, etc. The landing's BentoTile pattern: a small rounded
 * square with a tinted background and a lucide glyph. Centralises the
 * five places this is currently hand-rolled (PlanLanding, About,
 * NotFound, CookingCalculator, SupplementGuide).
 */
export function AccentTile({
  Icon,
  accent = 'primary',
  size = 'md',
  className,
  'aria-hidden': ariaHidden,
}: {
  Icon: LucideIcon;
  accent?: Accent;
  size?: Size;
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const s = SIZE[size];
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        s.wrap,
        s.radius,
        ACCENT[accent],
        className,
      )}
      aria-hidden={ariaHidden ?? true}
    >
      <Icon className={s.icon} />
    </span>
  );
}

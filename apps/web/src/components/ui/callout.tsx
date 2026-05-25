import type { ReactNode } from 'react';
import { AlertTriangle, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Eyebrow } from './eyebrow';

type Tone = 'info' | 'warning' | 'success' | 'danger';

const STYLES: Record<Tone, { card: string; eyebrow: 'info' | 'warning' | 'success' | 'danger'; defaultIcon: LucideIcon }> = {
  info:    { card: 'bg-info/5 border-info/30',       eyebrow: 'info',    defaultIcon: Info },
  warning: { card: 'bg-warning/5 border-warning/30', eyebrow: 'warning', defaultIcon: AlertTriangle },
  success: { card: 'bg-success/5 border-success/30', eyebrow: 'success', defaultIcon: ShieldCheck },
  danger:  { card: 'bg-danger/5 border-danger/30',   eyebrow: 'danger',  defaultIcon: ShieldAlert },
};

/**
 * Tinted disclaimer / advisory card. Standardises the eyebrow + tinted
 * border-and-bg + leading icon pattern that today's PlanView, PetDetail,
 * FoodSafety, NutritionCalculator, and CookingCalculator re-roll
 * individually. One primitive, four tones, no per-page CSS drift.
 */
export function Callout({
  tone = 'info',
  eyebrow,
  icon: IconOverride,
  children,
  className,
}: {
  tone?: Tone;
  eyebrow?: ReactNode;
  /** Override the default icon for the tone. */
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  const s = STYLES[tone];
  const Icon = IconOverride ?? s.defaultIcon;
  return (
    <div className={cn('rounded-2xl border p-4 sm:p-5', s.card, className)}>
      {eyebrow && (
        <Eyebrow tone={s.eyebrow} className="mb-2 flex items-center gap-1.5">
          <Icon className="h-3 w-3" aria-hidden />
          {eyebrow}
        </Eyebrow>
      )}
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </div>
  );
}

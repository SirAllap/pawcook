import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { easeOut } from '../../lib/motion';
import { cn } from '../../lib/cn';

type Glow = 'none' | 'primary' | 'info';

/**
 * Page-level header. Mirrors the landing's section opener (eyebrow →
 * headline → sub) and optionally renders an ambient radial-glow halo
 * behind the title so list-landing pages (Pets, Meal plans) get the
 * same warm entrance as the landing hero. Data-dense pages should pass
 * `glow="none"` (default) — the halo competes with form/table content.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  glow = 'none',
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  glow?: Glow;
  className?: string;
}) {
  const glowColor = glow === 'info' ? 'hsl(var(--info) / 0.35)' : 'hsl(var(--primary) / 0.35)';

  return (
    <div className="relative isolate">
      {glow !== 'none' && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 -z-10 h-72 w-[28rem] sm:h-80 sm:w-[36rem] rounded-full blur-[120px] opacity-50"
          style={{ background: `radial-gradient(closest-side, ${glowColor}, transparent)` }}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}
      >
        <div>
          {eyebrow && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-balance">{title}</h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-muted-fg leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </motion.div>
    </div>
  );
}

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function StatTile({
  icon,
  label,
  value,
  unit,
  tone = 'primary',
  delay = 0,
  className,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  tone?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  delay?: number;
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: 'text-primary',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    neutral: 'text-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'rounded-2xl border border-border bg-surface-2 p-4 sm:p-5',
        'flex flex-col gap-2',
        className
      )}
    >
      {icon && <div className={cn('text-xl', tones[tone])}>{icon}</div>}
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-mono text-2xl sm:text-3xl font-black tracking-tight tabular-nums', tones[tone])}>
          {value}
        </span>
        {unit && <span className="text-xs font-bold text-muted-fg">{unit}</span>}
      </div>
    </motion.div>
  );
}

import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function MacroBar({
  segments,
  className,
}: {
  segments: { key: string; pct: number; color: string; label?: string }[];
  className?: string;
}) {
  const summary = segments
    .map((s) => s.label ?? `${s.key}: ${Math.round(s.pct * 100)}%`)
    .join(', ');
  return (
    <div
      className={cn('flex h-3 w-full overflow-hidden rounded-full bg-surface-3 gap-px', className)}
      role="img"
      aria-label={summary}
    >
      {segments.map((s, i) => (
        <motion.div
          key={s.key}
          title={s.label}
          aria-hidden
          initial={{ width: 0 }}
          animate={{ width: `${s.pct * 100}%` }}
          transition={{ duration: 0.8, delay: 0.05 + i * 0.06, ease: [0.32, 0.72, 0, 1] }}
          className={cn('h-full', s.color)}
          style={s.color.startsWith('hsl') || s.color.startsWith('#') ? { background: s.color } : undefined}
        />
      ))}
    </div>
  );
}

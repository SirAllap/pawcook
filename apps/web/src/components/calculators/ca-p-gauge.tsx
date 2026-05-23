import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/cn';

export function CaPGauge({
  ratio,
  target,
}: {
  ratio: number;
  target: { min: number; max: number };
}) {
  const reduced = useReducedMotion();
  const max = 4;
  const pct = Math.min(100, Math.max(0, (ratio / max) * 100));
  const safeStart = (target.min / max) * 100;
  const safeEnd   = (target.max / max) * 100;
  const inRange   = ratio >= target.min && ratio <= target.max;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">Ca : P ratio</p>
          <p className="text-xs text-muted-fg mt-0.5">Safe zone {target.min} – {target.max} : 1</p>
        </div>
        <span
          className={cn(
            'font-mono text-2xl font-black tabular-nums',
            inRange ? 'text-success' : 'text-danger'
          )}
        >
          {ratio.toFixed(2)} : 1
        </span>
      </div>

      <div className="relative h-4 rounded-full bg-surface-3 overflow-hidden border border-border">
        <div
          className="absolute inset-y-0 bg-success/20 border-x border-success/40"
          style={{ left: `${safeStart}%`, width: `${safeEnd - safeStart}%` }}
          aria-hidden
        />
        <motion.div
          initial={reduced ? { left: `calc(${pct}% - 4px)` } : { left: '0%' }}
          animate={{ left: `calc(${pct}% - 4px)` }}
          transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            'absolute inset-y-0 w-2 rounded-full shadow-lg',
            inRange ? 'bg-success' : 'bg-danger'
          )}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-fg font-semibold font-mono">
        <span>0</span>
        <span className="text-success">{target.min}</span>
        <span className="text-success">{target.max}</span>
        <span>4+</span>
      </div>
    </div>
  );
}

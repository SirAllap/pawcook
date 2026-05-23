import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { easeOut } from '../../lib/motion';
import { cn } from '../../lib/cn';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
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
  );
}

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}
    >
      {icon && (
        <motion.div
          animate={reduced ? undefined : { y: [0, -6, 0] }}
          transition={reduced ? undefined : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 text-5xl text-muted-fg"
          aria-hidden
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-fg max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

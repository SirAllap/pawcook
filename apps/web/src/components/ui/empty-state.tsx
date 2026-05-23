import { type ReactNode } from 'react';
import { motion } from 'motion/react';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}
    >
      {icon && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 text-5xl text-muted-fg"
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

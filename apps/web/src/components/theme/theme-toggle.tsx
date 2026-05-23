import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const isDark = resolvedTheme === 'dark';
  const label = isDark
    ? t('common.switchToLight', { defaultValue: 'Switch to light mode' })
    : t('common.switchToDark',  { defaultValue: 'Switch to dark mode' });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
        'text-foreground hover:bg-surface-2 transition-colors active:scale-95',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={reduced ? false : { opacity: 0, rotate: -45, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.7 }}
          transition={{ duration: reduced ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex"
        >
          {isDark ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

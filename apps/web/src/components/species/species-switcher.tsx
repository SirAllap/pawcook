import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSpecies } from '../../lib/species';
import { DogIcon, CatIcon } from './species-icons';
import { Tooltip } from '../ui/tooltip';
import { cn } from '../../lib/cn';

/**
 * Two-state species toggle. Single tap flips dog ↔ cat. The icon morphs
 * with a spring; the label below updates via i18n. Kept compact so it
 * sits naturally next to the theme + language controls in the top bar.
 */
export function SpeciesSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { species, toggle } = useSpecies();
  const isCat = species === 'cat';

  return (
    <Tooltip content={t(`species.tooltip.${isCat ? 'cat' : 'dog'}`)} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('species.switchTo', { other: t(`species.${isCat ? 'dog' : 'cat'}`) })}
        aria-pressed={isCat}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
          'text-foreground hover:bg-surface-2 transition-colors active:scale-95',
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={species}
            initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0,  scale: 1 }}
            exit={{    opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="inline-flex"
          >
            {isCat ? <CatIcon className="h-5 w-5" /> : <DogIcon className="h-5 w-5" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}

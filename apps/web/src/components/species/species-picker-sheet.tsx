import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { Drawer } from 'vaul';
import { useSpecies } from '../../lib/species';
import { DogIcon, CatIcon } from './species-icons';
import { cn } from '../../lib/cn';

/**
 * First-run picker. Shown automatically when the user hasn't chosen a
 * species yet. The user can pick, or tap "decide later" — which seeds a
 * default but doesn't lock them out of browsing the rest of the app.
 */
export function SpeciesPickerSheet() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const { hasChosen, setSpecies } = useSpecies();

  return (
    <Drawer.Root open={!hasChosen} dismissible={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          aria-labelledby="species-sheet-title"
          aria-describedby="species-sheet-desc"
          className={cn(
            'fixed inset-x-0 bottom-0 z-[110] flex flex-col items-stretch rounded-t-[28px]',
            'bg-surface text-surface-fg border-t border-border shadow-xl',
            'max-h-[90dvh] outline-none'
          )}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        >
          <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-border" aria-hidden />
          <div className="px-6 pt-4 pb-2 text-center">
            <Drawer.Title
              id="species-sheet-title"
              className="text-2xl font-black tracking-tight text-balance"
            >
              {t('species.welcome.title')}
            </Drawer.Title>
            <Drawer.Description
              id="species-sheet-desc"
              className="mt-2 text-sm text-muted-fg text-balance"
            >
              {t('species.welcome.body')}
            </Drawer.Description>
          </div>

          <div className="px-5 pt-4 pb-4 grid grid-cols-2 gap-3">
            {(['dog', 'cat'] as const).map((s) => {
              const Icon = s === 'dog' ? DogIcon : CatIcon;
              return (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={reduced ? undefined : { scale: 0.96 }}
                  onClick={() => setSpecies(s)}
                  aria-label={t(`species.${s}`)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-border bg-surface-2',
                    'px-4 py-6 hover:border-primary hover:bg-primary/5 active:bg-primary/10 transition-colors'
                  )}
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-9 w-9" aria-hidden />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-black tracking-tight">{t(`species.${s}`)}</p>
                    <p className="text-xs text-muted-fg mt-1">
                      {t(`species.welcome.${s}Desc`)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setSpecies('dog')}
              className="text-xs font-bold text-muted-fg hover:text-foreground underline underline-offset-4 px-3 py-2"
            >
              {t('species.welcome.decideLater', { defaultValue: 'Decide later — show me the app' })}
            </button>
          </div>

          <p className="px-6 pb-2 text-center text-[11px] text-muted-fg">
            {t('species.welcome.footnote')}
          </p>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

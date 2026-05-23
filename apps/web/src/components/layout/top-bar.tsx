import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { PawMark, Wordmark } from '../brand/logo';
import { ThemeToggle } from '../theme/theme-toggle';
import { LanguageSwitcher } from '../i18n/language-switcher';
import { SpeciesSwitcher } from '../species/species-switcher';
import { DesktopNav } from './desktop-nav';
import { useIsDesktop } from '../../lib/use-media-query';
import { useSpecies } from '../../lib/species';
import { cn } from '../../lib/cn';

// Routes where the global species switcher doesn't apply — each pet
// carries its own species inside these multi-species zones.
const MULTI_SPECIES_ROUTES = ['/pets', '/meal-plan'];

export function TopBar() {
  const { t } = useTranslation();
  const { species } = useSpecies();
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { scrollY } = useScroll();
  const [elevated, setElevated] = useState(false);

  const isMultiSpeciesZone = MULTI_SPECIES_ROUTES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + '/'),
  );

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setElevated(latest > 8);
  });

  useEffect(() => {
    setElevated(window.scrollY > 8);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: elevated ? 'hsl(var(--surface) / 0.85)' : 'hsl(var(--background) / 0)',
        boxShadow: elevated ? 'var(--shadow-sm)' : '0 0 0 rgba(0,0,0,0)',
        borderColor: elevated ? 'hsl(var(--border) / 0.7)' : 'hsl(var(--border) / 0)',
      }}
      transition={{ duration: 0.25 }}
      className={cn(
        'sticky top-0 z-40 w-full no-print pt-safe',
        'backdrop-blur-xl border-b'
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label={t('common.brandHome')}>
            <PawMark className="h-7 w-7" />
            <div className="flex flex-col leading-none">
              <Wordmark />
              <span className="hidden sm:block text-[10px] text-muted-fg font-medium mt-0.5">
                {isMultiSpeciesZone
                  ? t('common.allYourPets')
                  : t(species === 'cat' ? 'common.catFoodCalc' : 'common.dogFoodCalc')}
              </span>
            </div>
          </NavLink>

          {isDesktop && <DesktopNav />}

          <div className="flex items-center gap-1">
            {!isMultiSpeciesZone && <SpeciesSwitcher />}
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

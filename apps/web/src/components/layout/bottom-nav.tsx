import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Flame,
  Activity,
  ShieldAlert,
  Pill,
  Info,
  PawPrint,
  ClipboardList,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '../../lib/cn';
import { Sheet } from '../ui/sheet';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// The four daily tools live on the bar; reference material (food safety,
// supplements, about) lives one tap away under "More". Five slots keeps every
// label readable down to a 320px phone — seven crushed them.
const PRIMARY: { to: string; labelKey: string; Icon: IconType }[] = [
  { to: '/pets',      labelKey: 'nav.pets',      Icon: PawPrint },
  { to: '/meal-plan', labelKey: 'nav.plan',      Icon: ClipboardList },
  { to: '/cooking',   labelKey: 'nav.cooking',   Icon: Flame },
  { to: '/nutrition', labelKey: 'nav.nutrition', Icon: Activity },
];

const MORE: { to: string; labelKey: string; Icon: IconType }[] = [
  { to: '/food-safety', labelKey: 'nav.foodSafety',  Icon: ShieldAlert },
  { to: '/supplements', labelKey: 'nav.supplements', Icon: Pill },
  { to: '/about',       labelKey: 'nav.about',        Icon: Info },
];

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Landing is a marketing page — the bento grid IS the navigation in a
  // far more inviting form, so the bottom-nav chrome would just compete
  // with the CTAs for attention. Skip rendering it on '/'.
  if (location.pathname === '/') return null;

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/');
  const moreActive = MORE.some((m) => isActive(m.to));

  return (
    <>
      <nav
        aria-label={t('nav.primary', { defaultValue: 'Primary navigation' })}
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 no-print px-3 pointer-events-none"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
      >
        <div className="pointer-events-auto glass shadow-xl rounded-[26px] overflow-hidden">
          <div className="grid grid-cols-5 h-16 relative">
            {PRIMARY.map(({ to, labelKey, Icon }) => {
              const active = isActive(to);
              const label = t(labelKey);
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-0.5',
                    'min-h-[44px] transition-colors active:scale-95',
                    active ? 'text-primary' : 'text-muted-fg',
                  )}
                >
                  {active && <ActivePill />}
                  <NavIcon Icon={Icon} active={active} />
                  <NavLabel label={label} />
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label={t('nav.more', { defaultValue: 'More' })}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'min-h-[44px] transition-colors active:scale-95',
                moreActive ? 'text-primary' : 'text-muted-fg',
              )}
            >
              {moreActive && <ActivePill />}
              <NavIcon Icon={MoreHorizontal} active={moreActive} />
              <NavLabel label={t('nav.more', { defaultValue: 'More' })} />
            </button>
          </div>
        </div>
      </nav>

      <Sheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title={t('nav.more', { defaultValue: 'More' })}
      >
        <div className="flex flex-col gap-1 pb-2">
          {MORE.map(({ to, labelKey, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors',
                isActive(to) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-2',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="flex-1 font-semibold">{t(labelKey)}</span>
              <ChevronRight className="h-4 w-4 text-muted-fg" aria-hidden />
            </Link>
          ))}
        </div>
        <p className="px-4 pt-1 text-xs leading-relaxed text-muted-fg">
          {t('common.disclaimer')}
        </p>
      </Sheet>
    </>
  );
}

function ActivePill() {
  // MotionConfig reducedMotion="user" doesn't reliably suppress layoutId
  // (shared-layout) springs, so gate it explicitly: snap the pill into place
  // with no spring when the user prefers reduced motion.
  const reduced = useReducedMotion();
  return (
    <motion.span
      layoutId="bottom-nav-pill"
      className="absolute inset-x-1 inset-y-1.5 -z-10 rounded-2xl bg-primary/12"
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30 }}
    />
  );
}

function NavIcon({ Icon, active }: { Icon: IconType; active: boolean }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      animate={{ scale: reduced || !active ? 1 : 1.12 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      className="inline-flex"
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden />
    </motion.span>
  );
}

function NavLabel({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-bold leading-none truncate w-full text-center px-0.5">
      {label}
    </span>
  );
}

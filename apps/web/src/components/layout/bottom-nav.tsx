import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Flame, Dog, ShieldAlert, Pill, Info } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { cn } from '../../lib/cn';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs: { to: string; label: string; Icon: IconType }[] = [
    { to: '/cooking',     label: t('nav.cooking'),     Icon: Flame },
    { to: '/nutrition',   label: t('nav.nutrition'),   Icon: Dog },
    { to: '/food-safety', label: t('nav.foodSafety'),  Icon: ShieldAlert },
    { to: '/supplements', label: t('nav.supplements'), Icon: Pill },
    { to: '/about',       label: t('nav.about'),       Icon: Info },
  ];

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 no-print px-3 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <div className="pointer-events-auto glass shadow-xl rounded-[26px] overflow-hidden">
        <div className="grid grid-cols-5 h-[60px] relative">
          {tabs.map(({ to, label, Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'transition-colors active:scale-95',
                  active ? 'text-primary' : 'text-muted-fg'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-x-2 inset-y-1.5 -z-10 rounded-2xl bg-primary/12"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.08 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                </motion.span>
                <span className="text-[10px] font-bold leading-none truncate w-full text-center px-0.5">
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

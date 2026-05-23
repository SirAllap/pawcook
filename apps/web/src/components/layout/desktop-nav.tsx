import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export function DesktopNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const items = [
    { to: '/cooking',     label: t('nav.cooking') },
    { to: '/nutrition',   label: t('nav.nutrition') },
    { to: '/food-safety', label: t('nav.foodSafety') },
    { to: '/supplements', label: t('nav.supplements') },
    { to: '/about',       label: t('nav.about') },
  ];

  return (
    <nav className="flex items-center gap-0.5 text-sm">
      {items.map(({ to, label }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              'relative px-3.5 py-2 rounded-xl font-semibold transition-colors',
              active ? 'text-foreground' : 'text-muted-fg hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId="desktop-nav-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-surface-2 border border-border/70"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}

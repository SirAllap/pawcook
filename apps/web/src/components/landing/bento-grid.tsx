import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import {
  Dog, Flame, ShieldAlert, Pill, Sparkles, PawPrint, ClipboardList, ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { FadeIn } from '../motion/fade-in';
import { useSpeciesT } from '../../lib/use-species-t';
import { cn } from '../../lib/cn';

type Tile = {
  to: string;
  titleKey: string;
  titleDefault: string;
  descKey: string;
  descDefault: string;
  Icon: LucideIcon;
  className: string;
  accent: 'primary' | 'info' | 'danger' | 'success' | 'accent' | 'warning';
  feature?: ReactNode;
};

const ACCENT_BG: Record<Tile['accent'], string> = {
  primary: 'bg-primary/10 text-primary',
  info:    'bg-info/10 text-info',
  danger:  'bg-danger/10 text-danger',
  success: 'bg-success/10 text-success',
  accent:  'bg-accent/15 text-accent',
  warning: 'bg-warning/15 text-warning',
};

function MacroBarsFeature() {
  const { t } = useTranslation();
  return (
    <div className="absolute right-4 bottom-4 w-32 sm:w-44 space-y-1.5">
      {[
        { key: 'protein', label: t('landing.bento.preview.protein'), pct: 45, color: 'bg-primary' },
        { key: 'fat',     label: t('landing.bento.preview.fat'),     pct: 30, color: 'bg-warning' },
        { key: 'veg',     label: t('landing.bento.preview.veg'),     pct: 25, color: 'bg-success' },
      ].map((m, i) => (
        <div key={m.key}>
          <div className="flex justify-between text-[9px] font-bold text-muted-fg mb-0.5">
            <span>{m.label}</span><span>{m.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', m.color)}
              initial={{ width: 0 }}
              whileInView={{ width: `${m.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThermometerFeature() {
  const { t } = useTranslation();
  return (
    <div className="absolute right-5 bottom-5 inline-flex items-end gap-2">
      <div className="h-20 w-3 rounded-full bg-surface-3 overflow-hidden flex items-end">
        <motion.div
          className="w-full bg-gradient-to-t from-warning to-danger rounded-full"
          initial={{ height: '0%' }}
          whileInView={{ height: '74%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div>
        <p className="text-2xl font-black font-mono text-warning leading-none">74°C</p>
        <p className="text-[10px] font-bold text-muted-fg uppercase tracking-wider">{t('landing.bento.preview.safeCore')}</p>
      </div>
    </div>
  );
}


function SearchFeature() {
  const { t } = useTranslation();
  return (
    <div className="absolute right-4 bottom-4 left-4 sm:left-auto sm:w-56 rounded-xl bg-surface border border-border px-3 py-2 flex items-center gap-2 shadow-sm">
      <ShieldAlert className="h-4 w-4 text-danger" />
      <span className="text-xs font-mono text-foreground lowercase">{t('toxicData.chocolate.label')}</span>
      <span className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-md bg-danger/15 text-danger">{t('common.toxic')}</span>
    </div>
  );
}

export function BentoGrid() {
  const { t } = useTranslation();

  const tiles: Tile[] = [
    {
      to: '/nutrition',
      titleKey: 'nav.nutrition',
      titleDefault: 'Nutrition',
      descKey: 'landing.bento.nutrition',
      descDefault: 'Daily macros, calories and Ca:P balance, tuned to your dog.',
      Icon: Dog,
      accent: 'primary',
      className: 'sm:col-span-2 sm:row-span-2 min-h-[260px]',
      feature: <MacroBarsFeature />,
    },
    {
      to: '/pets',
      titleKey: 'landing.bento.petsTitle',
      titleDefault: 'Pet profiles',
      descKey: 'landing.bento.petsDesc',
      descDefault: 'Save dogs and cats with allergies and conditions.',
      Icon: PawPrint,
      accent: 'info',
      className: 'sm:col-span-2 min-h-[200px]',
    },
    {
      to: '/cooking',
      titleKey: 'nav.cooking',
      titleDefault: 'Cooking',
      descKey: 'landing.bento.cooking',
      descDefault: 'Safe time & temperature for every meat.',
      Icon: Flame,
      accent: 'warning',
      className: 'sm:col-span-2 min-h-[200px]',
      feature: <ThermometerFeature />,
    },
    {
      to: '/meal-plan',
      titleKey: 'landing.bento.planTitle',
      titleDefault: 'Meal plans',
      descKey: 'landing.bento.planDesc',
      descDefault: '7, 14, or 30-day plans with a shopping list.',
      Icon: ClipboardList,
      accent: 'accent',
      className: 'sm:col-span-2 min-h-[200px]',
    },
    {
      to: '/food-safety',
      titleKey: 'nav.foodSafety',
      titleDefault: 'Food safety',
      descKey: 'landing.bento.foodSafety',
      descDefault: 'Toxic foods, safe meats, vegetables, fruits.',
      Icon: ShieldAlert,
      accent: 'danger',
      className: 'sm:col-span-2 min-h-[200px]',
      feature: <SearchFeature />,
    },
    {
      to: '/supplements',
      titleKey: 'nav.supplements',
      titleDefault: 'Supplements',
      descKey: 'landing.bento.supplements',
      descDefault: 'AAFCO targets, balancers and a 7-day transition.',
      Icon: Pill,
      accent: 'success',
      className: 'sm:col-span-2 min-h-[180px]',
    },
    {
      to: '/nutrition',
      titleKey: 'landing.bento.dietsTitle',
      titleDefault: '5 diet profiles',
      descKey: 'landing.bento.dietsDesc',
      descDefault: 'Balanced cooked · BARF · PMR · High protein · Ancestral.',
      Icon: Sparkles,
      accent: 'accent',
      className: 'sm:col-span-2 min-h-[180px]',
    },
  ];

  return (
    <FadeIn className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {t('landing.bento.eyebrow', { defaultValue: 'Everything you need' })}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
          {t('landing.bento.heading', { defaultValue: 'One toolkit. Every meal.' })}
        </h2>
        <p className="mt-3 text-muted-fg">
          {t('landing.bento.sub', { defaultValue: 'Tools that turn home cooking from guesswork into a routine you trust.' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 sm:auto-rows-[100px] gap-3">
        {tiles.map((tile, i) => (
          <BentoTile key={tile.titleKey + i} tile={tile} index={i} />
        ))}
      </div>
    </FadeIn>
  );
}

function BentoTile({ tile, index }: { tile: Tile; index: number }) {
  const tS = useSpeciesT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={tile.className}
    >
      <Link
        to={tile.to}
        className={cn(
          'relative h-full w-full overflow-hidden rounded-2xl border border-border',
          'bg-surface hover:bg-surface-2 transition-colors',
          'p-5 flex flex-col group'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', ACCENT_BG[tile.accent])}>
            <tile.Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-fg transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <h3 className="mt-3 text-lg font-bold tracking-tight">
          {tS(tile.titleKey, { defaultValue: tile.titleDefault })}
        </h3>
        <p className="mt-1 text-sm text-muted-fg leading-relaxed max-w-xs">
          {tS(tile.descKey, { defaultValue: tile.descDefault })}
        </p>
        {tile.feature}
      </Link>
    </motion.div>
  );
}

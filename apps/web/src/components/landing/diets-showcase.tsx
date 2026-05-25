import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../motion/fade-in';
import { useSpecies } from '../../lib/species';
import { useSpeciesT } from '../../lib/use-species-t';
import { cn } from '../../lib/cn';

type Diet = {
  key: string;
  emoji: string;
  macros: { p: number; f: number; v: number };
  glow: string;
};

// Macros are a visual approximation tied to nutrition.ts profiles.
// (p) muscle/protein, (f) bone+organ+liver+seafood combined as "raw add-ins",
// (v) veg+starch+fiber+seeds+fruit. Numbers track the actual profile
// component percentages in packages/shared/src/nutrition*.ts.
const DOG_DIETS: Diet[] = [
  { key: 'balanced_cooked', emoji: '⚖️', macros: { p: 50, f: 0,  v: 50 }, glow: 'from-primary/30' },
  { key: 'high_protein',    emoji: '💪', macros: { p: 55, f: 0,  v: 45 }, glow: 'from-danger/25' },
  { key: 'pmr',             emoji: '🦴', macros: { p: 80, f: 20, v: 0  }, glow: 'from-warning/30' },
  { key: 'barf',            emoji: '🌿', macros: { p: 70, f: 20, v: 10 }, glow: 'from-success/30' },
  { key: 'real_ancestral',  emoji: '🐺', macros: { p: 64, f: 26, v: 10 }, glow: 'from-info/25' },
];

const CAT_DIETS: Diet[] = [
  { key: 'cat_pmr',              emoji: '🦴', macros: { p: 84, f: 16, v: 0  }, glow: 'from-warning/30' },
  { key: 'cat_frankenprey',      emoji: '🥩', macros: { p: 84, f: 16, v: 0  }, glow: 'from-primary/30' },
  { key: 'cat_whole_prey',       emoji: '🐭', macros: { p: 80, f: 12, v: 8  }, glow: 'from-info/25' },
  { key: 'cat_barf_lite',        emoji: '🌿', macros: { p: 75, f: 10, v: 15 }, glow: 'from-success/30' },
  { key: 'cat_cooked_carnivore', emoji: '🍳', macros: { p: 70, f: 25, v: 5  }, glow: 'from-danger/25' },
];

export function DietsShowcase() {
  const { t } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();

  const diets = species === 'cat' ? CAT_DIETS : DOG_DIETS;

  return (
    <FadeIn className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {t('landing.diets.eyebrow', { defaultValue: 'Power-user mode' })}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
          {t('landing.diets.heading', { defaultValue: 'Or pick your own diet' })}
        </h2>
        <p className="mt-3 text-muted-fg">
          {t('landing.diets.subPower', {
            defaultValue:
              'Simple meals is the default. Turn it off and you get five profiles per species, all AAFCO-aligned, all surfaced behind a single toggle.',
          })}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 no-scrollbar snap-x snap-mandatory">
        {diets.map((diet, i) => (
          <motion.div
            key={diet.key}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            className="relative shrink-0 w-[80%] sm:w-auto snap-start"
          >
            <Link
              to="/nutrition"
              className={cn(
                'relative block overflow-hidden h-full rounded-3xl border border-border bg-surface p-5',
                'transition-colors hover:bg-surface-2 group'
              )}
            >
              <div className={cn(
                'pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-60 bg-gradient-radial',
                diet.glow,
                'bg-gradient-to-br to-transparent'
              )} />

              <div className="flex items-center justify-between">
                <span className="text-3xl">{diet.emoji}</span>
                <ArrowRight className="h-4 w-4 text-muted-fg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight">{t(`nutrition.dietShort.${diet.key}`)}</h3>
              <p className="text-xs text-muted-fg mt-0.5">{t(`nutrition.dietSub.${diet.key}`)}</p>

              {/* Macro ring */}
              <div className="mt-5">
                <MacroRing macros={diet.macros} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </FadeIn>
  );
}

function MacroRing({ macros }: { macros: { p: number; f: number; v: number } }) {
  const { t } = useTranslation();
  const C = 2 * Math.PI * 30;
  const segs = [
    { val: macros.p, color: 'hsl(var(--primary))' },
    { val: macros.f, color: 'hsl(var(--warning))' },
    { val: macros.v, color: 'hsl(var(--success))' },
  ];
  let acc = 0;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 80 80" className="h-16 w-16 -rotate-90">
        <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        {segs.map((s, i) => {
          const dash = (s.val / 100) * C;
          const offset = -acc;
          acc += dash;
          return (
            <motion.circle
              key={i}
              cx="40" cy="40" r="30"
              fill="none"
              stroke={s.color}
              strokeWidth="10"
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={0}
              initial={{ strokeDasharray: `0 ${C}` }}
              whileInView={{ strokeDasharray: `${dash} ${C}` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.15, ease: [0.32, 0.72, 0, 1] }}
              style={{ strokeDashoffset: offset, transformOrigin: '40px 40px' }}
            />
          );
        })}
      </svg>
      <div className="text-[10px] font-bold text-muted-fg space-y-0.5">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" />{t('landing.bento.preview.protein')} {macros.p}%</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning" />{t('landing.bento.preview.fat')} {macros.f}%</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-success" />{t('landing.bento.preview.veg')} {macros.v}%</div>
      </div>
    </div>
  );
}

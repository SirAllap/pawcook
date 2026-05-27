import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Pill, Snowflake, ChefHat, Sparkles, Dog, Cat, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { FadeIn } from '../motion/fade-in';
import { cn } from '../../lib/cn';

const AUTO_ADVANCE_MS = 6000;

/**
 * Product preview carousel. Each slide is a real-UI mockup built with
 * the same design tokens as the live product — not a screenshot, not an
 * external image. Trade-off: more LOC than dropping PNGs into /public,
 * but the mockups stay pixel-current as the design system evolves and
 * we never ship stale screenshots.
 */
export function ProductPreview() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const slides = useMemo(
    () => [
      {
        key: 'plan',
        eyebrow: t('landing.preview.plan.eyebrow', { defaultValue: 'Plan view' }),
        caption: t('landing.preview.plan.caption', {
          defaultValue: 'Each meal card shows grams + kcal. Supplement card sits up top — every deficit is named, every dose is exact.',
        }),
        principle: t('landing.preview.plan.principle', {
          defaultValue: 'Surface deficits loudly; never simulate them silently.',
        }),
        Mock: PlanMock,
      },
      {
        key: 'cooking',
        eyebrow: t('landing.preview.cooking.eyebrow', { defaultValue: 'Cooking plan' }),
        caption: t('landing.preview.cooking.caption', {
          defaultValue: 'One bag per protein serve. Cook date · serve days · use by · pet tags — all derived from the plan, not fabricated.',
        }),
        principle: t('landing.preview.cooking.principle', {
          defaultValue: 'The cook flow drives the meal plan, not the reverse.',
        }),
        Mock: CookingMock,
      },
      {
        key: 'bag',
        eyebrow: t('landing.preview.bag.eyebrow', { defaultValue: 'Bag strategy' }),
        caption: t('landing.preview.bag.caption', {
          defaultValue: '"3 bags × 0.66 kg — one bag per chicken serve." Merge adjacent serves when fridge-safe to skip cook sessions.',
        }),
        principle: t('landing.preview.bag.principle', {
          defaultValue: 'Sub-threshold add-ins are pills, not ingredients.',
        }),
        Mock: BagMock,
      },
      {
        key: 'wizard',
        eyebrow: t('landing.preview.wizard.eyebrow', { defaultValue: 'Wizard' }),
        caption: t('landing.preview.wizard.caption', {
          defaultValue: '"Cook ahead" with live stats: bags · cook sessions · sessions saved vs daily. See the frugal payoff before you generate.',
        }),
        principle: t('landing.preview.wizard.principle', {
          defaultValue: "Followability is a nutritional input, not a UX nicety.",
        }),
        Mock: WizardMock,
      },
    ],
    [t],
  );

  // Auto-advance with pause-on-hover. Respects reduced-motion preference.
  useEffect(() => {
    if (reduced || paused) return;
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, paused, reduced, slides.length]);

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  const slide = slides[index]!;

  return (
    <FadeIn className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {t('landing.preview.eyebrow', { defaultValue: 'What you get' })}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-balance">
          {t('landing.preview.heading', { defaultValue: 'The actual product, not a marketing render' })}
        </h2>
        <p className="mt-3 text-muted-fg leading-relaxed">
          {t('landing.preview.sub', {
            defaultValue:
              'Four slices of the app — built from the same components you use after signing in. No fake screenshots.',
          })}
        </p>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <DeviceFrame>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.key}
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="h-full w-full"
            >
              <slide.Mock />
            </motion.div>
          </AnimatePresence>
        </DeviceFrame>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {slide.eyebrow}
          </p>
          <p className="text-base sm:text-lg font-bold leading-snug text-foreground text-balance">
            {slide.caption}
          </p>
          <p className="text-xs sm:text-sm text-muted-fg leading-relaxed italic border-l-2 border-primary/40 pl-3">
            "{slide.principle}"
          </p>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('landing.preview.prev', { defaultValue: 'Previous slide' })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('landing.preview.next', { defaultValue: 'Next slide' })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex items-center gap-1.5 ml-2" role="tablist">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={s.eyebrow}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-fg',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-border bg-surface shadow-xl shadow-black/5 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-surface-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <div className="flex-1 mx-3 h-6 rounded-md bg-surface-3 flex items-center justify-center text-[10px] font-mono text-muted-fg">
            pawcook.app
          </div>
        </div>
        {/* Slot for the mock UI */}
        <div className="p-4 sm:p-5 min-h-[400px] sm:min-h-[440px] bg-surface">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Slide mocks. Each is a small Tailwind composition mimicking the
   real product surface. They share the design tokens (radii, accent
   classes) but live independently from the actual components so we
   don't accidentally regress real component behavior just to make a
   landing-page demo render.
   ────────────────────────────────────────────────────────────────── */

function PlanMock() {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-3">
      {/* Supplement card */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Pill className="h-3 w-3" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            {t('landing.preview.mock.plan.supplementsTitle', { defaultValue: 'Daily supplements' })}
          </span>
        </div>
        <div className="space-y-1.5 pl-1">
          <Row
            name={t('landing.preview.mock.plan.taurine', { defaultValue: 'Taurine powder' })}
            dose={t('landing.preview.mock.plan.taurineDose', { defaultValue: '250 mg/day' })}
          />
          <Row
            name={t('landing.preview.mock.plan.codLiver', { defaultValue: 'Cod liver oil' })}
            dose={t('landing.preview.mock.plan.codLiverDose', { defaultValue: '1 mL, 3×/week' })}
          />
          <Row
            name={t('landing.preview.mock.plan.calcium', { defaultValue: 'Calcium citrate' })}
            dose={t('landing.preview.mock.plan.calciumDose', { defaultValue: '287 mg/day' })}
          />
        </div>
      </div>

      {/* Day card */}
      <div className="rounded-2xl border border-border bg-surface-2 p-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-black tracking-tight">
            {t('landing.preview.mock.plan.dayLabel', {
              defaultValue: 'Day 1 · {{date}}',
              date: fmtMockDate('2026-05-25', i18n.language, true),
            })}
          </span>
          <span className="text-[10px] font-mono text-muted-fg">
            {t('landing.preview.mock.plan.beefDay', { defaultValue: 'Beef day' })}
          </span>
        </div>
        <div className="space-y-1.5">
          <MealRow species="dog" pet="Luna" grams={150} kcal={304} mainGrams={68} />
          <MealRow species="dog" pet="Dora" grams={466} kcal={766} mainGrams={210} />
          <MealRow species="cat" pet="Blacky" grams={128} kcal={224} mainGrams={62} />
        </div>
      </div>
    </div>
  );
}

function Row({ name, dose }: { name: string; dose: string }) {
  return (
    <div className="flex items-baseline justify-between text-[11px]">
      <span className="font-bold text-foreground">{name}</span>
      <span className="font-mono text-primary tabular-nums">{dose}</span>
    </div>
  );
}

function MealRow({ species, pet, grams, kcal, mainGrams }: { species: 'dog' | 'cat'; pet: string; grams: number; kcal: number; mainGrams: number }) {
  const { t } = useTranslation();
  const speciesLabel = t(`pets.species.${species}`, { defaultValue: species });
  return (
    <div className="rounded-lg bg-surface px-2.5 py-2 flex items-center justify-between gap-2 text-[11px]">
      <div className="flex items-center gap-1.5 min-w-0">
        {species === 'cat'
          ? <Cat className="h-3 w-3 text-info shrink-0" aria-hidden />
          : <Dog className="h-3 w-3 text-primary shrink-0" aria-hidden />}
        <span className="font-bold truncate">{pet} · {speciesLabel}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-muted-fg font-mono tabular-nums">{grams} g · {kcal} kcal</span>
        <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 font-mono text-[10px]">
          {t('landing.preview.mock.plan.mainGrams', { defaultValue: '{{g}}g beef', g: mainGrams })}
        </span>
      </div>
    </div>
  );
}

function CookingMock() {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="rounded-2xl border border-border bg-surface-2 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
          {t('landing.preview.mock.cooking.title', { defaultValue: 'Cooking plan' })}
        </p>
        <p className="text-xs font-bold mt-0.5">
          {t('landing.preview.mock.cooking.summary', {
            defaultValue: '4 bags · 4 cook sessions · one protein per bag',
          })}
        </p>
      </div>

      {/* Bag group: Beef */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-2 border-b border-border">
          <span className="text-xs font-black">
            {t('cooking.meats.beef', { defaultValue: 'Beef' })}
          </span>
          <span className="text-[10px] text-muted-fg font-mono">
            {t('landing.preview.mock.cooking.groupTotal', {
              defaultValue: '{{bags}} bags · {{g}} g total',
              bags: 2,
              g: '2,580',
            })}
          </span>
        </div>
        <ul className="divide-y divide-border/50">
          <BagRow n={1} total={2} dateIsos={['2026-05-25', '2026-05-26']} useByIso="2026-05-29" grams={1290} />
          <BagRow n={2} total={2} dateIsos={['2026-05-31', '2026-06-01']} useByIso="2026-06-04" grams={1290} />
        </ul>
      </div>

      {/* Bag group: Chicken */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-2 border-b border-border">
          <span className="text-xs font-black">
            {t('cooking.meats.chicken', { defaultValue: 'Chicken' })}
          </span>
          <span className="text-[10px] text-muted-fg font-mono">
            {t('landing.preview.mock.cooking.groupTotal', {
              defaultValue: '{{bags}} bags · {{g}} g total',
              bags: 2,
              g: '2,540',
            })}
          </span>
        </div>
        <ul className="divide-y divide-border/50">
          <BagRow n={1} total={2} dateIsos={['2026-05-27', '2026-05-28']} useByIso="2026-05-31" grams={1270} />
          <BagRow n={2} total={2} dateIsos={['2026-06-02', '2026-06-03']} useByIso="2026-06-06" grams={1270} />
        </ul>
      </div>
    </div>
  );
}

function BagRow({ n, total, dateIsos, useByIso, grams }: { n: number; total: number; dateIsos: string[]; useByIso: string; grams: number }) {
  const { t, i18n } = useTranslation();
  const dates = dateIsos.map((d) => fmtMockDate(d, i18n.language)).join(' · ');
  const useBy = fmtMockDate(useByIso, i18n.language);
  return (
    <li className="px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
      <span className="font-bold">
        {t('mealPlan.cookingPlan.bagN', { defaultValue: 'Bag {{n}} of {{total}}', n, total })}
      </span>
      <span className="text-muted-fg flex items-center gap-1.5">
        <Snowflake className="h-3 w-3" aria-hidden />
        {t('landing.preview.mock.cooking.bagRow', {
          defaultValue: '{{dates}} · use by {{useBy}}',
          dates,
          useBy,
        })}
      </span>
      <span className="font-mono tabular-nums text-foreground shrink-0">{grams} g</span>
    </li>
  );
}

/**
 * Locale-format an ISO date for the landing mock cards. `withWeekday`
 * adds the weekday name; mock dates are illustrative-only.
 */
function fmtMockDate(iso: string, locale: string, withWeekday = false): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString(locale, {
    ...(withWeekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
  });
}

function BagMock() {
  const { t, i18n } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Snowflake className="h-3 w-3" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            {t('cooking.bagStrategy.title', { defaultValue: 'Bag strategy' })}
          </span>
        </div>
        <p className="text-sm font-black text-foreground">
          {t('cooking.bagStrategy.hero', {
            defaultValue: '{{bags}} bags × {{kg}} kg — one bag per {{meat}} serve',
            bags: 3,
            kg: '0.66',
            meat: t('cooking.meats.chicken', { defaultValue: 'chicken' }).toLowerCase(),
          })}
        </p>

        {/* Merge stepper */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">
            {t('cooking.bagStrategy.mergeLabel', { defaultValue: 'Combine bags' })}
          </p>
          <div className="grid grid-cols-3 gap-1">
            <StepBtn
              label={t('cooking.bagStrategy.mergePerServe', { defaultValue: 'Per serve' })}
              sub={t('cooking.bagStrategy.mergeBagCount', { defaultValue: '{{n}} bag(s)', n: 3 })}
              active
            />
            <StepBtn
              label={t('cooking.bagStrategy.mergeFewer', { defaultValue: 'Fewer bags' })}
              sub={t('cooking.bagStrategy.mergeBagCount', { defaultValue: '{{n}} bag(s)', n: 2 })}
            />
            <StepBtn
              label={t('cooking.bagStrategy.mergeAll', { defaultValue: 'One bag' })}
              sub={t('cooking.bagStrategy.mergeBagCount', { defaultValue: '{{n}} bag(s)', n: 1 })}
            />
          </div>
        </div>

        <ul className="rounded-lg border border-primary/20 bg-surface divide-y divide-border/50 text-[11px]">
          {[
            { n: 1, dateIso: '2026-05-25', useByIso: '2026-05-28' },
            { n: 2, dateIso: '2026-05-28', useByIso: '2026-05-31' },
            { n: 3, dateIso: '2026-05-31', useByIso: '2026-06-03' },
          ].map((b) => (
            <li key={b.n} className="flex items-center justify-between gap-2 px-3 py-1.5">
              <span className="font-bold">
                {t('cooking.bagStrategy.bagRowLabel', { defaultValue: 'Bag {{n}}', n: b.n })}
              </span>
              <span className="text-muted-fg text-right truncate">
                {t('cooking.bagStrategy.bagRow', {
                  defaultValue: 'serves {{serveDates}} · use by {{useBy}}',
                  serveDates: fmtMockDate(b.dateIso, i18n.language),
                  useBy: fmtMockDate(b.useByIso, i18n.language),
                })}
              </span>
              <span className="font-mono tabular-nums shrink-0">660 g</span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-foreground/80 leading-snug">
          {t('landing.preview.mock.bag.summary', {
            defaultValue:
              '{{bags}} {{meat}} bag(s) across {{days}} days for {{pets}} pets. Cook all {{kg}} kg at once — fridge 1 bag, freeze the rest.',
            bags: 3,
            meat: t('cooking.meats.chicken', { defaultValue: 'chicken' }).toLowerCase(),
            days: 7,
            pets: 3,
            kg: '1.98',
          })}
        </p>
      </div>
    </div>
  );
}

function StepBtn({ label, sub, active }: { label: string; sub: string; active?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-0 py-2 rounded-md text-[10px] border',
      active
        ? 'bg-primary text-primary-fg border-primary'
        : 'bg-surface border-border text-muted-fg',
    )}>
      <span className="font-bold uppercase tracking-wider">{label}</span>
      <span className="font-mono tabular-nums">{sub}</span>
    </div>
  );
}

function WizardMock() {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-surface-2 p-3 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
          {t('mealPlan.sourcing.cookAheadLabel', { defaultValue: 'Cook ahead' })}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <WizardChip label={t('mealPlan.sourcing.cookAhead.perServe', { defaultValue: 'Per serve' })} />
          <WizardChip label={t('mealPlan.sourcing.cookAhead.upTo2', { defaultValue: 'Up to 2 days' })} active />
          <WizardChip label={t('mealPlan.sourcing.cookAhead.upTo3', { defaultValue: 'Up to 3 days' })} />
        </div>
        <p className="text-[11px] text-muted-fg">
          {t('mealPlan.sourcing.cookAheadCaption', { defaultValue: 'One protein per bag · veggies in their own bags' })}
        </p>
        <p className="text-[11px] font-mono tabular-nums text-foreground/80">
          {t('mealPlan.sourcing.cookAheadStatsSaving', {
            defaultValue: '{{bags}} bags · {{sessions}} cook session(s) · saves {{saved}} vs daily',
            bags: 4,
            sessions: 4,
            saved: 7,
          })}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-3 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
          {t('mealPlan.sourcing.prefsLabel', { defaultValue: 'Sourcing prefs' })}
        </p>
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-2.5 py-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" aria-hidden />
              {t('mealPlan.sourcing.simpleMeals', { defaultValue: 'Simple meals' })}
            </span>
            <span className="text-[10px] text-muted-fg">
              {t('landing.preview.mock.wizard.simpleMealsShort', {
                defaultValue: 'One protein per meal · daily supplement card covers the gap',
              })}
            </span>
          </div>
          <div className="h-5 w-9 rounded-full bg-primary flex items-center justify-end px-0.5">
            <span className="h-4 w-4 rounded-full bg-primary-fg" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-3">
        <p className="text-xs font-bold flex items-center gap-1.5">
          <ChefHat className="h-3 w-3 text-primary" aria-hidden />
          {t('mealPlan.wizard.generate', { defaultValue: 'Generate plan' })}
        </p>
        <p className="text-[10px] text-muted-fg mt-0.5">
          {t('landing.preview.mock.wizard.summary', {
            defaultValue: '7 days · Luna · Dora · Blacky · sous-vide',
          })}
        </p>
      </div>
    </div>
  );
}

function WizardChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={cn(
      'py-1.5 px-2 rounded-md text-center text-[10px] font-bold border',
      active
        ? 'bg-primary text-primary-fg border-primary'
        : 'bg-surface border-border text-muted-fg',
    )}>
      {label}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck, Dog, Cat } from 'lucide-react';
import { PawMark } from '../brand/logo';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';
import { useSpecies } from '../../lib/species';
import { useSpeciesT } from '../../lib/use-species-t';

const SOURCES = ['AAFCO', 'NRC', 'FEDIAF', 'WSAVA', 'ACVN'];

export function Hero() {
  const { t } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
  const reduced = useReducedMotion();

  return (
    // No `overflow-hidden` here — we WANT the radial glows below to bleed
    // past the section bounds so their natural blur halo blends into the
    // surrounding page background. Only the grain texture (which has a
    // visible dotted pattern boundary) gets a clipped wrapper below.
    <section className="relative isolate">
      {/* Ambient glows — render OUTSIDE any overflow-hidden so the blur
         halo can extend naturally beyond the section's edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 h-[640px] w-[640px] rounded-full blur-[140px] opacity-60"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.55), transparent)' }}
          animate={reduced ? undefined : { x: ['-50%', '-46%', '-54%', '-50%'], y: [0, -8, 6, 0] }}
          transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-24 -right-32 h-[460px] w-[460px] rounded-full blur-[130px] opacity-45"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--hero-glow-b) / 0.65), transparent)' }}
          animate={reduced ? undefined : { x: [0, -12, 8, 0], y: [0, 14, -6, 0] }}
          transition={reduced ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full blur-[140px] opacity-35"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--hero-glow-c) / 0.6), transparent)' }}
          animate={reduced ? undefined : { x: [0, 10, -8, 0], y: [0, -10, 4, 0] }}
          transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grain texture — clipped to the section so its dotted pattern
         doesn't show a visible square boundary outside the hero area. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-grain opacity-50" />
      </div>

      <div className="relative mx-auto max-w-5xl pt-12 sm:pt-20 pb-12 sm:pb-20 text-center">
        {/* Floating paw mark */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto mb-6 inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[26px] bg-primary/10 border border-primary/25 shadow-glow"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
            transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <PawMark className="h-12 w-12 sm:h-14 sm:w-14" animated={false} />
          </motion.div>
        </motion.div>

        {/* Pre-headline pill */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.15, duration: reduced ? 0 : 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-bold text-muted-fg backdrop-blur-sm"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
          {t('landing.hero.badge', { defaultValue: 'Vet-aligned methodology' })}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.25, duration: reduced ? 0 : 0.7, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            'mt-5 mx-auto max-w-3xl text-balance font-black tracking-tight leading-[1.02]',
            'text-[clamp(2.5rem,8vw,5.5rem)]'
          )}
        >
          <span className="text-foreground">{t('landing.hero.headlineA', { defaultValue: 'Real food.' })}</span>{' '}
          <span className="text-gradient-brand">
            {species === 'cat'
              ? t('landing.hero.headlineB_cat', { defaultValue: 'For your real cat.' })
              : t('landing.hero.headlineB', { defaultValue: 'For your real dog.' })}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.4, duration: reduced ? 0 : 0.6 }}
          className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-muted-fg text-pretty leading-relaxed"
        >
          {t('landing.hero.subtitleHousehold', {
            defaultValue:
              'Dogs and cats. One bag, one cook session, one plan you\'ll actually follow. We handle the macros, the safety temps, and the supplements.',
          })}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.55, duration: reduced ? 0 : 0.6 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild variant="glow" size="lg" className="w-full sm:w-auto">
            <Link to="/meal-plan/new">
              {t('landing.hero.ctaPrimary', { defaultValue: 'Start a plan' })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <a href="#how-it-works">
              {t('landing.hero.ctaSecondary', { defaultValue: 'How it works' })}
            </a>
          </Button>
        </motion.div>

        {/* Species chip row — visual cue that PawCook handles both species
           and (after the household rollout) the multi-species case too. */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.7, duration: reduced ? 0 : 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-1.5"
        >
          {[
            { Icon: Dog, key: 'landing.hero.chipDogs', def: 'Dogs' },
            { Icon: Cat, key: 'landing.hero.chipCats', def: 'Cats' },
            { Icon: null, key: 'landing.hero.chipBoth', def: 'Both, sharing one bag' },
          ].map(({ Icon, key, def }, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[10px] font-bold text-muted-fg"
            >
              {Icon && <Icon className="h-3 w-3 text-primary" aria-hidden />}
              {t(key, { defaultValue: def })}
            </span>
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.8, duration: reduced ? 0 : 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-fg">
            {t('landing.trustedBy', { defaultValue: 'Methodology grounded in' })}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-md border border-border bg-surface/60 px-2 py-1 text-[10px] font-black tracking-wider text-muted-fg"
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PawMark } from '../brand/logo';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';
import { useSpecies } from '../../lib/species';

const SOURCES = ['AAFCO', 'NRC', 'FEDIAF', 'WSAVA', 'ACVN'];

export function Hero() {
  const { t } = useTranslation();
  const { species } = useSpecies();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full blur-[120px] opacity-60"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent)' }}
          animate={{ x: ['-50%', '-46%', '-54%', '-50%'], y: [0, -8, 6, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-[-10%] h-[360px] w-[360px] rounded-full blur-[110px] opacity-40"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--hero-glow-b) / 0.6), transparent)' }}
          animate={{ x: [0, -12, 8, 0], y: [0, 14, -6, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] h-[420px] w-[420px] rounded-full blur-[120px] opacity-30"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--hero-glow-c) / 0.6), transparent)' }}
          animate={{ x: [0, 10, -8, 0], y: [0, -10, 4, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-grain opacity-50" />
      </div>

      <div className="relative mx-auto max-w-5xl pt-12 sm:pt-20 pb-12 sm:pb-20 text-center">
        {/* Floating paw mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto mb-6 inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[26px] bg-primary/10 border border-primary/25 shadow-glow"
        >
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <PawMark className="h-12 w-12 sm:h-14 sm:w-14" animated={false} />
          </motion.div>
        </motion.div>

        {/* Pre-headline pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-bold text-muted-fg backdrop-blur-sm"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          {t('landing.hero.badge', { defaultValue: 'Vet-aligned methodology' })}
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-muted-fg text-pretty leading-relaxed"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild={false} variant="glow" size="lg" className="w-full sm:w-auto">
            <Link
              to="/nutrition"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {t('landing.hero.cta', { defaultValue: 'Calculate nutrition' })}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            to="/food-safety"
            className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-2xl bg-surface-2 hover:bg-surface-3 border border-border text-foreground font-semibold transition-colors active:scale-[0.97] w-full sm:w-auto"
          >
            {t('landing.hero.learnMore', { defaultValue: 'Browse safe foods' })}
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
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

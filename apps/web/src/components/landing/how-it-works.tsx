import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { FadeIn } from '../motion/fade-in';
import { Home, ClipboardList, ChefHat, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useSpeciesT } from '../../lib/use-species-t';
import { cn } from '../../lib/cn';

const STEPS = [
  {
    Icon: Home,
    titleKey: 'landing.how.step1.title',
    titleDefault: 'Add your household',
    descKey: 'landing.how.step1.desc',
    descDefault: 'One profile per pet — dogs, cats, or both. Weight, age, activity, allergies.',
    accent: 'primary',
  },
  {
    Icon: ClipboardList,
    titleKey: 'landing.how.step2.title',
    titleDefault: 'Generate one plan',
    descKey: 'landing.how.step2.desc',
    descDefault: 'Simple meals by default: one protein per day, shared across pets. Sous-vide, oven, stovetop — your pick.',
    accent: 'accent',
  },
  {
    Icon: ChefHat,
    titleKey: 'landing.how.step3.title',
    titleDefault: 'Cook one bag, dose the rest',
    descKey: 'landing.how.step3.desc',
    descDefault: 'Sous-vide a single household bag; follow the daily supplement card for what the bag doesn\'t cover.',
    accent: 'warning',
  },
] as const;

const ACCENTS = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  accent:  'bg-accent/15 text-accent border-accent/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
} as const;

export function HowItWorks() {
  const { t } = useTranslation();
  const tS = useSpeciesT();
  return (
    <FadeIn className="space-y-10" id="how-it-works">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {t('landing.how.eyebrow', { defaultValue: 'How it works' })}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
          {tS('landing.how.heading')}
        </h2>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3 relative">
        {/* connector line on desktop */}
        <div aria-hidden className="hidden sm:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {STEPS.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.12, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="relative rounded-3xl border border-border bg-surface p-6"
          >
            <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl border', ACCENTS[step.accent])}>
              <step.Icon className="h-6 w-6" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-xs font-black text-muted-fg">0{i + 1}</span>
              <h3 className="text-lg font-bold tracking-tight">{tS(step.titleKey) || step.titleDefault}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-fg leading-relaxed">
              {tS(step.descKey) || step.descDefault}
            </p>
          </motion.li>
        ))}
      </ol>

      {/* Convert at the moment of highest intent — right after the reader
          understands the three steps. */}
      <div className="flex justify-center">
        <Button asChild variant="glow" size="lg">
          <Link to="/meal-plan/new">
            {t('landing.how.cta', { defaultValue: 'Start your plan' })}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </FadeIn>
  );
}

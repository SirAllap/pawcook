import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Dog, Cat, ArrowRight, Package, Pill } from 'lucide-react';
import { FadeIn } from '../motion/fade-in';
import { cn } from '../../lib/cn';

/**
 * The killer narrative: a household → one bag → daily supplements,
 * laid out as three columns the reader scans left to right. Replaces
 * the abstract feature-tile pattern with a concrete story tied to the
 * Followability Mandate. Each card carries a single one-line caption
 * that ties it back to a sub-principle.
 */
export function HouseholdToBag() {
  const { t } = useTranslation();

  const cols = [
    {
      eyebrow: t('landing.story.col1.eyebrow', { defaultValue: 'Your household' }),
      body: t('landing.story.col1.body', { defaultValue: '2 dogs + 1 cat. Same beef on beef day.' }),
      caption: t('landing.story.col1.caption', { defaultValue: 'The household is the unit, not the pet.' }),
      content: <HouseholdIllustration />,
    },
    {
      eyebrow: t('landing.story.col2.eyebrow', { defaultValue: 'One bag' }),
      body: t('landing.story.col2.body', { defaultValue: 'One protein, one cook session, one fridge window.' }),
      caption: t('landing.story.col2.caption', { defaultValue: 'The cook flow drives the meal plan, not the reverse.' }),
      content: <BagIllustration />,
    },
    {
      eyebrow: t('landing.story.col3.eyebrow', { defaultValue: 'Daily supplements' }),
      body: t('landing.story.col3.body', { defaultValue: 'Taurine + cod liver oil cover what the bag doesn\'t.' }),
      caption: t('landing.story.col3.caption', { defaultValue: 'Surface deficits loudly; never simulate them silently.' }),
      content: <SupplementsIllustration />,
    },
  ];

  return (
    <FadeIn className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
          {t('landing.story.eyebrow', { defaultValue: 'Household → Bag → Supplements' })}
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-balance">
          {t('landing.story.heading', { defaultValue: 'One plan a real kitchen can execute' })}
        </h2>
        <p className="mt-3 text-muted-fg leading-relaxed">
          {t('landing.story.sub', {
            defaultValue:
              'The full nutritional engine is still there. It just stops being the default. What you get is a plan that survives Tuesday at 7 a.m.',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Connector arrows on desktop */}
        <div aria-hidden className="hidden md:flex absolute top-[88px] inset-x-0 justify-around pointer-events-none -mx-4">
          <div className="opacity-0 w-1/3" />
          <div className="w-1/3 flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-primary/40 -ml-16" />
          </div>
          <div className="w-1/3 flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-primary/40 -ml-16" />
          </div>
        </div>

        {cols.map((col, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: i * 0.1, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="relative rounded-3xl border border-border bg-surface p-6 flex flex-col"
          >
            <div className="h-32 flex items-center justify-center mb-4">{col.content}</div>
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">{col.eyebrow}</p>
            <p className="mt-1.5 text-base font-bold leading-snug text-foreground">{col.body}</p>
            <p className="mt-3 text-xs text-muted-fg leading-relaxed italic">"{col.caption}"</p>
          </motion.div>
        ))}
      </div>
    </FadeIn>
  );
}

function HouseholdIllustration() {
  return (
    <div className="flex items-center justify-center gap-2">
      <PetCircle Icon={Dog} accent="primary" size="lg" />
      <PetCircle Icon={Dog} accent="primary" size="md" />
      <PetCircle Icon={Cat} accent="info" size="sm" />
    </div>
  );
}

function BagIllustration() {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 -m-4 rounded-3xl bg-primary/8 blur-2xl" aria-hidden />
      <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-surface-2 border-2 border-primary/30">
        <Package className="h-10 w-10 text-primary" aria-hidden />
      </div>
      <span className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-fg text-[10px] font-mono font-black">
        ×3
      </span>
    </div>
  );
}

function SupplementsIllustration() {
  return (
    <div className="flex items-center justify-center gap-3">
      <PillCircle label="T" accent="success" />
      <PillCircle label="A" accent="warning" />
      <PillCircle Icon={Pill} accent="info" />
    </div>
  );
}

function PetCircle({
  Icon, accent, size,
}: {
  Icon: typeof Dog;
  accent: 'primary' | 'info';
  size: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-16 w-16' };
  const iconSize = { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-7 w-7' };
  const accentMap = {
    primary: 'bg-primary/15 border-primary/30 text-primary',
    info: 'bg-info/15 border-info/30 text-info',
  };
  return (
    <div className={cn('inline-flex items-center justify-center rounded-full border-2', sizeMap[size], accentMap[accent])}>
      <Icon className={iconSize[size]} aria-hidden />
    </div>
  );
}

function PillCircle({
  Icon, label, accent,
}: {
  Icon?: typeof Pill;
  label?: string;
  accent: 'success' | 'warning' | 'info';
}) {
  const accentMap = {
    success: 'bg-success/15 border-success/30 text-success',
    warning: 'bg-warning/15 border-warning/30 text-warning',
    info: 'bg-info/15 border-info/30 text-info',
  };
  return (
    <div className={cn('inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 font-black text-xl', accentMap[accent])}>
      {label ?? (Icon ? <Icon className="h-6 w-6" aria-hidden /> : null)}
    </div>
  );
}

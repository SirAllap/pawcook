import { useTranslation } from 'react-i18next';
import { Quote } from 'lucide-react';
import { FadeIn } from '../motion/fade-in';

/**
 * Followability Mandate as a value-prop card. Lifts the north-star
 * principle from /CLAUDE.md straight onto the landing so first-time
 * visitors see the brand voice before the feature grid. Deliberately
 * quote-styled (no buttons, no links) — sets tone, doesn't convert.
 */
export function MantraCard() {
  const { t } = useTranslation();
  return (
    <FadeIn>
      <section className="relative mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.55), transparent)' }}
          />
          <Quote className="h-6 w-6 text-primary/60 mb-4" aria-hidden />
          <p className="text-balance text-xl sm:text-2xl font-bold leading-snug tracking-tight text-foreground">
            {t('landing.mantra.body', {
              defaultValue:
                "The plan you'll actually cook beats the plan that's perfectly balanced on paper.",
            })}
          </p>
          <p className="mt-4 text-sm sm:text-base text-muted-fg leading-relaxed max-w-xl">
            {t('landing.mantra.elab', {
              defaultValue:
                "PawCook's job is to make nutritionally adequate food easy to put on the floor — not to make nutritionally optimal food the owner abandons by week two.",
            })}
          </p>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {t('landing.mantra.attribution', { defaultValue: 'The Followability Mandate' })}
          </p>
        </div>
      </section>
    </FadeIn>
  );
}

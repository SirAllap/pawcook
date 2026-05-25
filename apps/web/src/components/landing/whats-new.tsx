import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { FadeIn } from '../motion/fade-in';

/**
 * Single-row "what's new" strip. Builds trust for an active OSS
 * project: the README and changelog live elsewhere, but here we
 * surface the highest-signal recent shipped features at a glance.
 * Updated by hand when meaningful work lands — keep it short.
 */
export function WhatsNew() {
  const { t } = useTranslation();
  return (
    <FadeIn>
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface-2/40 backdrop-blur-sm px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-black uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t('landing.whatsNew.eyebrow', { defaultValue: 'Recently shipped' })}
        </span>
        <span className="text-muted-fg leading-relaxed">
          {t('landing.whatsNew.list', {
            defaultValue:
              'Followability Mandate · Block rotation · Simple meals · Supplement card · Plan-aware cooking · Edit + rename plans',
          })}
        </span>
      </div>
    </FadeIn>
  );
}

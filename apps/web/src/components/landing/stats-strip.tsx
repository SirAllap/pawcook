import { useTranslation } from 'react-i18next';
import { NumberFlow } from '../motion/number-flow';
import { FadeIn } from '../motion/fade-in';

const STATS = [
  { value: 8,   labelKey: 'landing.stats.languages',   suffix: '' },
  { value: 5,   labelKey: 'landing.stats.diets',       suffix: '' },
  { value: 60,  labelKey: 'landing.stats.foods',       suffix: '+' },
  { value: 100, labelKey: 'landing.stats.openSource',  suffix: '%' },
];

export function StatsStrip() {
  const { t } = useTranslation();
  return (
    <FadeIn>
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-surface-2/40 backdrop-blur-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {STATS.map((s) => (
            <div key={s.labelKey} className="p-5 sm:p-6 text-center">
              <div className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                <NumberFlow value={s.value} />
                <span className="text-primary">{s.suffix}</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-fg">
                {t(s.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

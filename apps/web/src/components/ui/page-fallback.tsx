import { useTranslation } from 'react-i18next';
import { PawMark } from '../brand/logo';

export function PageFallback() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('common.loading', { defaultValue: 'Loading…' })}
      className="flex flex-col items-center justify-center gap-4 py-16"
    >
      <span className="sr-only">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </span>
      <PawMark className="h-8 w-8 opacity-90" animated={false} />
      <span
        className="h-5 w-5 rounded-full border-2 border-border border-t-primary animate-spin"
        aria-hidden
      />
    </div>
  );
}

import { useTranslation } from 'react-i18next';

export function PageFallback() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('common.loading', { defaultValue: 'Loading' })}
      className="flex items-center justify-center py-24"
    >
      <span className="sr-only">
        {t('common.loading', { defaultValue: 'Loading' })}
      </span>
      <span
        className="h-6 w-6 rounded-full border-2 border-border border-t-primary animate-spin"
        aria-hidden
      />
    </div>
  );
}

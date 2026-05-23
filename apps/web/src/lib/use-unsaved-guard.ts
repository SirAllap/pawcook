import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Warns on full page reload / tab close when there are unsaved form changes.
 * Intra-app navigation (React Router) is handled separately with useBlocker
 * once routes opt into a data router; for now this catches the worst case.
 */
export function useUnsavedGuard(dirty: boolean): void {
  const { t } = useTranslation();
  useEffect(() => {
    if (!dirty) return;
    const message = t('common.unsavedChanges', {
      defaultValue: 'You have unsaved changes. Are you sure you want to leave?',
    });
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, t]);
}

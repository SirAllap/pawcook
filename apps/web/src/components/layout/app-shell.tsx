import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '../ui/tooltip';
import { Toaster } from 'sonner';
import { useTheme } from '../../lib/theme';
import { useIsDesktop } from '../../lib/use-media-query';
import { TopBar } from './top-bar';
import { BottomNav } from './bottom-nav';
import { Footer } from './footer';
import { SpeciesPickerSheet } from '../species/species-picker-sheet';
import { ErrorBoundary } from '../error-boundary';

export function AppShell({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const isDesktop = useIsDesktop();

  // Keep <html lang> in sync so AT pronounce localized content correctly.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = i18n.language?.slice(0, 2) || 'en';
  }, [i18n.language]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-fg focus:font-bold focus:shadow-lg"
        >
          {t('common.skipToContent', { defaultValue: 'Skip to content' })}
        </a>

        <TopBar />

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-32 lg:pb-12 outline-none"
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        <Footer />
        <BottomNav />
        <SpeciesPickerSheet />

        <Toaster
          theme={resolvedTheme}
          position={isDesktop ? 'top-center' : 'bottom-center'}
          richColors
          closeButton
          offset={isDesktop ? 16 : 84}
          toastOptions={{
            classNames: {
              toast: 'rounded-2xl border border-border bg-surface text-foreground shadow-lg',
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}

import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
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
import { cn } from '../../lib/cn';

export function AppShell({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  // On landing we hide the bottom nav, so the page doesn't need the
  // reserved padding that prevents content from being covered by it.
  const isLanding = location.pathname === '/';
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
          className={cn(
            'flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 pt-4 outline-none',
            // 128px reserves room for the floating bottom nav on mobile.
            // Landing hides the nav so it gets only the small desktop
            // padding (12) at every breakpoint.
            isLanding ? 'pb-12' : 'pb-32 lg:pb-12',
          )}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        <Footer />
        {/* Only mount the bottom nav on non-desktop so it isn't a second
            "Primary navigation" landmark in the DOM behind the desktop nav. */}
        {!isDesktop && <BottomNav />}
        <SpeciesPickerSheet />

        <Toaster
          theme={resolvedTheme}
          position={isDesktop ? 'top-center' : 'bottom-center'}
          richColors
          closeButton
          offset={isDesktop ? 16 : 96}
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

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
          // Top-center on every breakpoint. These are passive confirmation
          // toasts with no actions, so the thumb-zone rationale for bottom
          // placement doesn't apply — and bottom placement collided with the
          // floating bottom nav (a lingering error toast could cover all five
          // nav targets). Anchoring to the top sidesteps the nav, the
          // home-indicator gesture zone, and the nav-height coupling entirely.
          position="top-center"
          richColors
          closeButton
          // Clear the sticky TopBar (h-14 mobile / h-16 desktop) plus its
          // safe-area inset so the toast drops in just below it. Sonner ignores
          // `offset` under 600px and reads `mobileOffset`, so set both.
          offset={{ top: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
          mobileOffset={{
            top: 'calc(env(safe-area-inset-top) + 4.5rem)',
            // Match the bottom nav's px-3 outer inset (0.75rem) so the toast
            // width echoes the nav bar — they read as one app-shell dock.
            left: '0.75rem',
            right: '0.75rem',
          }}
          toastOptions={{
            // Translated label for the close affordance (the rest of the app
            // is i18n'd; sonner's default is hard-coded English).
            closeButtonAriaLabel: t('common.close'),
            classNames: {
              // Echo the nav's glass pill — same radius + shadow — so the toast
              // reads as part of the same chrome family, not a stray card. No
              // bg/text here: that would defeat `richColors` and leave colour as
              // the lone status signal (WCAG 1.4.1).
              toast: 'rounded-[26px] shadow-xl',
              // The glass surface applies ONLY to plain toasts (matching the
              // nav material); success / error / warning / info keep richColors'
              // accessible tinted bg + fg pairs.
              default: 'glass text-foreground',
              // 44px touch target (iOS HIG / WCAG 2.5.5), up from sonner's 20px.
              closeButton: 'h-11 w-11',
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}

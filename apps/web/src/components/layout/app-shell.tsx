import { type ReactNode } from 'react';
import { TooltipProvider } from '../ui/tooltip';
import { Toaster } from 'sonner';
import { useTheme } from '../../lib/theme';
import { TopBar } from './top-bar';
import { BottomNav } from './bottom-nav';
import { Footer } from './footer';

export function AppShell({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={250}>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <TopBar />

        <main className="flex-1 w-full mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-32 lg:pb-12">
          {children}
        </main>

        <Footer />
        <BottomNav />

        <Toaster
          theme={resolvedTheme}
          position="top-center"
          richColors
          closeButton
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

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { PawMark } from '../components/brand/logo';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Eyebrow } from '../components/ui/eyebrow';

export default function NotFound() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  return (
    <div className="relative isolate max-w-xl mx-auto py-12 sm:py-20">
      {/* Ambient glow — same shape as the landing hero so a typo'd
         URL still lands somewhere that feels like the rest of the
         app, not a Vite default. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-12 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-[140px] opacity-50"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent)' }}
          animate={reduced ? undefined : { x: ['-50%', '-46%', '-54%', '-50%'], y: [0, -8, 6, 0] }}
          transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Card padding="lg" variant="elevated" className="relative text-center space-y-5">
        {/* Floating paw mark — landing's hero gesture, used here so
           the not-found page reads as "still PawCook" rather than a
           generic 404 chrome. */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary/10 border border-primary/25 shadow-glow"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -4, 0], rotate: [0, -3, 3, 0] }}
            transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <PawMark className="h-9 w-9" animated={false} />
          </motion.div>
        </motion.div>

        <div>
          <Eyebrow className="mb-2">{t('notFound.eyebrow', { defaultValue: '404' })}</Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-balance">
            {t('notFound.title', { defaultValue: 'Page not found' })}
          </h1>
          <p className="mt-3 text-sm text-muted-fg leading-relaxed">
            {t('notFound.description', {
              defaultValue:
                "The page you’re looking for doesn’t exist or was moved.",
            })}
          </p>
        </div>

        <div className="flex justify-center">
          <Button asChild variant="primary" size="md">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.home', { defaultValue: 'Back to home' })}
            </Link>
          </Button>
        </div>

        {/* Direct routes to the most-likely intended destinations, so a
            mistyped deep link doesn't force a round-trip through home. */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {[
            { to: '/pets', label: t('nav.pets') },
            { to: '/meal-plan', label: t('nav.plan') },
            { to: '/cooking', label: t('nav.cooking') },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-muted-fg transition-colors hover:text-foreground hover:border-primary/40"
            >
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

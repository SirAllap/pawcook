import { Link } from 'react-router-dom';
import { Star, GitFork, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { GithubIcon } from '../brand/icons';
import { FadeIn } from '../motion/fade-in';
import { useSpeciesT } from '../../lib/use-species-t';
import { useGithubStars } from '../../lib/use-github-stars';

export function OssCta() {
  const { t, i18n } = useTranslation();
  const tS = useSpeciesT();
  const stars = useGithubStars();
  return (
    <FadeIn>
      <section className="relative rounded-3xl border border-border bg-surface p-8 sm:p-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.30), transparent)' }}
        />
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-3">
              <Heart className="h-3 w-3 fill-current" />
              {t('landing.open.eyebrow', { defaultValue: '100% open source' })}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('landing.open.title')}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-fg max-w-xl leading-relaxed">
              {tS('landing.open.text')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href="https://github.com/SirAllap/pawcook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-bold text-muted-fg hover:text-foreground transition-colors"
              >
                <Star className="h-3.5 w-3.5" />
                {stars !== null
                  ? t('landing.open.starsWithCount', {
                      defaultValue: '{{n}} stars',
                      n: stars.toLocaleString(i18n.language),
                    })
                  : t('landing.open.starUs', { defaultValue: 'Star on GitHub' })}
              </a>
              <a
                href="https://github.com/SirAllap/pawcook/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-bold text-muted-fg"
              >
                <GitFork className="h-3.5 w-3.5" /> {t('landing.open.fork', { defaultValue: 'Fork' })}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg" variant="primary">
              <a href="https://github.com/SirAllap/pawcook" target="_blank" rel="noopener noreferrer">
                <GithubIcon className="h-4 w-4" aria-hidden />
                GitHub
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">{t('landing.hero.learnMore', { defaultValue: 'Learn more' })}</Link>
            </Button>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

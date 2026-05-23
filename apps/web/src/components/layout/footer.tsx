import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { PawMark, Wordmark } from '../brand/logo';
import { GithubIcon } from '../brand/icons';
import { ThemeToggle } from '../theme/theme-toggle';
import { LanguageSwitcher } from '../i18n/language-switcher';

const SOURCES = ['AAFCO', 'NRC', 'FEDIAF', 'WSAVA', 'ACVN'];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hidden lg:block border-t border-border bg-surface-2/40 no-print">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <PawMark className="h-7 w-7" animated={false} />
              <Wordmark />
            </div>
            <p className="text-sm text-muted-fg max-w-sm leading-relaxed mb-4">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-bold text-muted-fg px-2 py-1 rounded-md bg-surface border border-border"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-fg mb-3">
              {t('nav.about')}
            </h4>
            <a
              href="https://github.com/SirAllap/pawcook"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub <ExternalLink className="h-3 w-3 text-muted-fg" />
            </a>
            <p className="text-xs text-muted-fg mt-3">MIT · Open source</p>
          </div>

          <div className="flex flex-col gap-3 items-start">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-fg">
              {t('common.preferences', { defaultValue: 'Preferences' })}
            </h4>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <p className="mt-8 pt-6 border-t border-border text-xs text-muted-fg leading-relaxed">
          ⚠️ {t('common.disclaimer')}
        </p>
      </div>
    </footer>
  );
}

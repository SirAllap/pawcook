import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, BookOpen, Heart, FileText, FlaskConical, Globe, Building2, Stethoscope } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { GithubIcon } from '../components/brand/icons';
import { FadeIn } from '../components/motion/fade-in';

const SOURCES: { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; url: string }[] = [
  { label: 'AAFCO Dog Food Nutrient Profiles',                  Icon: FileText,     url: 'https://www.aafco.org/resources/aafco-methods-for-substantiating-nutritional-adequacy-of-dog-and-cat-foods/' },
  { label: 'NRC Nutrient Requirements of Dogs and Cats (2006)', Icon: FlaskConical, url: 'https://www.nap.edu/catalog/10668/nutrient-requirements-of-dogs-and-cats' },
  { label: 'FEDIAF Nutritional Guidelines',                     Icon: Globe,        url: 'https://www.fediaf.org/self-regulation/nutrition.html' },
  { label: 'Merck Veterinary Manual',                           Icon: BookOpen,     url: 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals' },
  { label: 'WSAVA Global Nutrition Guidelines',                 Icon: Building2,    url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/' },
  { label: 'ACVN position statements',                          Icon: Stethoscope,  url: 'https://www.acvn.org/position-statements/' },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="space-y-7 sm:space-y-9 max-w-3xl">
      <PageHeader
        eyebrow={t('about.eyebrow', { defaultValue: 'About' })}
        title={t('about.title')}
        description={t('about.subtitle')}
      />

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden border-l-[3px] border-l-danger">
          <header className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <h2 className="font-black text-danger">{t('about.disclaimers')}</h2>
          </header>
          <div className="p-5 space-y-3">
            <p className="text-sm leading-relaxed text-foreground/90">{t('about.notVetAdvice')}</p>
            <Card padding="md" className="bg-danger/5 border-danger/30">
              <p className="text-sm font-bold leading-relaxed text-foreground/90">🦴 {t('about.noBones')}</p>
            </Card>
            <Card padding="md" className="bg-danger/5 border-danger/30">
              <p className="text-sm font-bold leading-relaxed text-foreground/90">🌡️ {t('about.pathogen')}</p>
            </Card>
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden">
          <header className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-black">{t('about.methodology')}</h2>
          </header>
          <div className="p-4 space-y-2">
            {SOURCES.map(({ label, Icon, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4 hover:bg-surface-3 hover:border-border transition-all active:scale-[0.99]"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-muted-fg group-hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium flex-1">{label}</p>
                <ExternalLink className="h-3.5 w-3.5 text-muted-fg group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card padding="lg" variant="elevated">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary fill-current" />
            <h2 className="font-black">{t('about.openSource')}</h2>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-5">
            {t('about.openSourceText')}{' '}
            <a
              href="https://github.com/SirAllap/pawcook"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover font-bold underline underline-offset-2 transition-colors"
            >
              {t('about.github')}
            </a>
            .
          </p>
          <Button asChild variant="outline" size="md">
            <a
              href="https://github.com/SirAllap/pawcook"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </Card>
      </FadeIn>
    </div>
  );
}

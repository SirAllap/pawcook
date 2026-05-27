import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, BookOpen, Heart, FileText, FlaskConical, Globe, Building2, Stethoscope, ShieldCheck, EyeOff, HardDrive, Trash2, Server } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { GithubIcon } from '../components/brand/icons';
import { FadeIn } from '../components/motion/fade-in';
import { useSpeciesT } from '../lib/use-species-t';
import { useSpecies } from '../lib/species';

type Source = { id: string; defaultLabel: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; url: string };

const DOG_SOURCES: Source[] = [
  { id: 'dog.aafco',  defaultLabel: 'AAFCO Dog Food Nutrient Profiles',                  Icon: FileText,     url: 'https://www.aafco.org/resources/aafco-methods-for-substantiating-nutritional-adequacy-of-dog-and-cat-foods/' },
  { id: 'dog.nrc',    defaultLabel: 'NRC Nutrient Requirements of Dogs and Cats (2006)', Icon: FlaskConical, url: 'https://www.nap.edu/catalog/10668/nutrient-requirements-of-dogs-and-cats' },
  { id: 'dog.fediaf', defaultLabel: 'FEDIAF Nutritional Guidelines',                     Icon: Globe,        url: 'https://www.fediaf.org/self-regulation/nutrition.html' },
  { id: 'dog.merck',  defaultLabel: 'Merck Veterinary Manual',                           Icon: BookOpen,     url: 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals' },
  { id: 'dog.wsava',  defaultLabel: 'WSAVA Global Nutrition Guidelines',                 Icon: Building2,    url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/' },
  { id: 'dog.acvn',   defaultLabel: 'ACVN position statements',                          Icon: Stethoscope,  url: 'https://www.acvn.org/position-statements/' },
];

const CAT_SOURCES: Source[] = [
  { id: 'cat.aafco',   defaultLabel: 'AAFCO Cat Food Nutrient Profiles',                                Icon: FileText,     url: 'https://www.aafco.org/resources/aafco-methods-for-substantiating-nutritional-adequacy-of-dog-and-cat-foods/' },
  { id: 'cat.nrc',     defaultLabel: 'NRC Nutrient Requirements of Dogs and Cats (2006)',               Icon: FlaskConical, url: 'https://www.nap.edu/catalog/10668/nutrient-requirements-of-dogs-and-cats' },
  { id: 'cat.aaha',    defaultLabel: 'AAHA / AAFP 2021 Feline Life Stage Guidelines',                   Icon: Building2,    url: 'https://www.aaha.org/resources/2021-aaha-aafp-feline-life-stage-guidelines/' },
  { id: 'cat.zoran',   defaultLabel: 'Zoran (2002) — The Carnivore Connection to Nutrition in Cats',    Icon: FlaskConical, url: 'https://avmajournals.avma.org/view/journals/javma/221/11/javma.2002.221.1559.xml' },
  { id: 'cat.catinfo', defaultLabel: 'catinfo.org — Lisa A. Pierson, DVM',                              Icon: BookOpen,     url: 'https://catinfo.org/making-cat-food/' },
  { id: 'cat.fediaf',  defaultLabel: 'FEDIAF Nutritional Guidelines',                                   Icon: Globe,        url: 'https://www.fediaf.org/self-regulation/nutrition.html' },
  { id: 'cat.acvn',    defaultLabel: 'ACVN position statements',                                        Icon: Stethoscope,  url: 'https://www.acvn.org/position-statements/' },
];

export default function About() {
  const { t } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
  const location = useLocation();
  const sources = species === 'cat' ? CAT_SOURCES : DOG_SOURCES;

  // Scroll to #privacy when arriving via the footer link.
  useEffect(() => {
    if (location.hash !== '#privacy') return;
    const el = document.getElementById('privacy');
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [location.hash]);

  return (
    <div className="space-y-7 sm:space-y-9 max-w-3xl">
      <PageHeader
        eyebrow={t('about.eyebrow', { defaultValue: 'About' })}
        title={t('about.title')}
        description={tS('about.subtitle')}
      />

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden border-l-[3px] border-l-danger">
          <header className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <h2 className="font-black text-danger">{t('about.disclaimers')}</h2>
          </header>
          <div className="p-5 space-y-3">
            <p className="text-sm leading-relaxed text-foreground/90">{tS('about.notVetAdvice')}</p>
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
            {sources.map(({ id, defaultLabel, Icon, url }) => (
              <a
                key={id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4 hover:bg-surface-3 hover:border-border transition-all active:scale-[0.99]"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-muted-fg group-hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium flex-1">
                  {t(`about.sources.${id}`, { defaultValue: defaultLabel })}
                </p>
                <ExternalLink className="h-3.5 w-3.5 text-muted-fg group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card
          id="privacy"
          padding="none"
          variant="elevated"
          className="overflow-hidden border-l-[3px] border-l-success scroll-mt-24"
        >
          <header className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h2 className="font-black">{t('about.privacy')}</h2>
          </header>
          <div className="p-5 space-y-4">
            <p className="text-sm leading-relaxed text-foreground/90">{t('about.privacyLead')}</p>

            <Card padding="md" className="bg-success/5 border-success/30">
              <div className="flex items-start gap-3">
                <EyeOff className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                  {t('about.privacyNoTracking')}
                </p>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card padding="md" variant="muted">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-black">{t('about.privacyStorageTitle')}</h3>
                </div>
                <p className="text-xs text-muted-fg leading-relaxed">{t('about.privacyStorageBody')}</p>
                <p className="mt-3 text-[11px] font-mono text-muted-fg/90 leading-relaxed break-all bg-surface rounded-lg border border-border p-2.5">
                  {t('about.privacyStorageKeys')}
                </p>
              </Card>

              <Card padding="md" variant="muted">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-black">{t('about.privacyClearTitle')}</h3>
                </div>
                <p className="text-xs text-muted-fg leading-relaxed">{t('about.privacyClearBody')}</p>
              </Card>
            </div>

            <Card padding="md" variant="muted">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black">{t('about.privacyHostTitle')}</h3>
              </div>
              <p className="text-xs text-muted-fg leading-relaxed">{t('about.privacyHostBody')}</p>
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
              >
                {t('about.privacyHostLink')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Card>
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
            >
              <GithubIcon className="h-4 w-4" aria-hidden />
              {t('about.github')}
            </a>
          </Button>
        </Card>
      </FadeIn>
    </div>
  );
}

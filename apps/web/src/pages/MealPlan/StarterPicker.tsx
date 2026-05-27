import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ChevronLeft, Dog, Cat, Users, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { AccentTile } from '../../components/ui/accent-tile';
import { Button } from '../../components/ui/button';
import { usePets } from '../../contexts/PetProfilesContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import {
  STARTER_TEMPLATES,
  instantiatePetsFromTemplate,
  type StarterTemplate,
  type StarterTemplateIcon,
} from '../../lib/starter-templates';

const ICONS: Record<StarterTemplateIcon, LucideIcon> = {
  Dog,
  Cat,
  Users,
  Heart,
};

const ACCENTS = ['primary', 'info', 'accent', 'success'] as const;

export default function StarterPicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addPet } = usePets();
  const { setAppliedTemplate, markStep } = useOnboarding();

  function applyTemplate(template: StarterTemplate) {
    const seeded = instantiatePetsFromTemplate(template, (key) => t(key));
    for (const pet of seeded) addPet(pet);
    setAppliedTemplate(template.id);
    markStep('starter_template_picked');
    navigate(`/meal-plan/new?template=${template.id}`, {
      state: { seedPetIds: seeded.map((p) => p.id) },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('onboarding.starter.eyebrow')}
        title={t('onboarding.starter.title')}
        description={t('onboarding.starter.subtitle')}
        glow="primary"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {STARTER_TEMPLATES.map((template, i) => {
          const Icon = ICONS[template.icon];
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <button
                type="button"
                onClick={() => applyTemplate(template)}
                className="block text-left w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              >
                <Card
                  padding="md"
                  className="h-full flex flex-col gap-3 transition-colors hover:bg-surface-2 group-focus-visible:border-primary"
                >
                  <div className="flex items-start gap-3">
                    <AccentTile Icon={Icon} accent={accent} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black tracking-tight">
                        {t(`${template.i18nKey}.title`)}
                      </h3>
                      <p className="text-xs text-muted-fg mt-0.5">
                        {t(`${template.i18nKey}.tag`)}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 text-muted-fg shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-foreground leading-snug">
                    {t(`${template.i18nKey}.description`)}
                  </p>
                </Card>
              </button>
            </motion.div>
          );
        })}
      </div>

      <Card padding="md" variant="muted" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black">{t('onboarding.starter.manualTitle')}</h3>
          <p className="text-xs text-muted-fg">{t('onboarding.starter.manualDescription')}</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/pets/new">
            {t('onboarding.starter.manualCta')}
          </Link>
        </Button>
      </Card>

      <div className="flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link to="/meal-plan">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t('onboarding.starter.back')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

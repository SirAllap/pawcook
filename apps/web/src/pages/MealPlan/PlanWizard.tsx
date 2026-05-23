import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Calendar, Sparkles, RotateCcw, Save } from 'lucide-react';
import {
  generateMealPlan, SourcingPrefsSchema,
  type MealPlan, type PetProfile, type PlanDuration, type SourcingPrefs,
} from '@pawcook/shared';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SectionLabel } from '../../components/ui/section-label';
import { EmptyState } from '../../components/ui/empty-state';
import { PetAvatar } from '../../components/pets/PetAvatar';
import { SourcingPicker } from '../../components/meal-plan/SourcingPicker';
import { CalendarGrid } from '../../components/meal-plan/CalendarGrid';
import { NutrientCoverageCard } from '../../components/meal-plan/NutrientCoverageCard';
import { usePets } from '../../contexts/PetProfilesContext';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { cn } from '../../lib/cn';

const DURATIONS: PlanDuration[] = [7, 14, 30];

export default function PlanWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pets, ready: petsReady } = usePets();
  const { addPlan } = useMealPlans();

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [duration, setDuration] = useState<PlanDuration>(7);
  const [sourcing, setSourcing] = useState<SourcingPrefs>(() => SourcingPrefsSchema.parse({}));
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<MealPlan | null>(null);

  const selectedPets = useMemo(
    () => pets.filter((p) => selectedPetIds.includes(p.id)),
    [pets, selectedPetIds],
  );

  function togglePet(id: string) {
    setSelectedPetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function regenerate() {
    if (selectedPets.length === 0) return;
    const plan = generateMealPlan({
      name: name || defaultName(selectedPets, duration, t),
      pets: selectedPets,
      durationDays: duration,
      startDate: new Date().toISOString().slice(0, 10),
      sourcing,
    });
    setPreview(plan);
  }

  function save() {
    if (!preview) return;
    const finalName = name || preview.name;
    const toSave: MealPlan = { ...preview, name: finalName };
    addPlan(toSave);
    toast.success(t('mealPlan.toast.saved', { name: finalName }));
    navigate(`/meal-plan/${toSave.id}`);
  }

  if (!petsReady) return null;

  if (pets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('mealPlan.eyebrow')}
          title={t('mealPlan.new.title')}
          description={t('mealPlan.new.subtitle')}
        />
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title={t('mealPlan.needPet.title')}
          description={t('mealPlan.needPet.description')}
        />
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate('/pets/new')}>
            {t('mealPlan.needPet.cta')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={t('mealPlan.new.title')}
        description={t('mealPlan.new.subtitle')}
      />

      {/* Step 1 — Pets */}
      <Card padding="md" className="space-y-3">
        <SectionLabel>{t('mealPlan.wizard.pets')}</SectionLabel>
        <p className="text-xs text-muted-fg">{t('mealPlan.wizard.petsHelp')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pets.map((pet) => {
            const active = selectedPetIds.includes(pet.id);
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => togglePet(pet.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-2 hover:bg-surface-3',
                )}
              >
                <PetAvatar photo={pet.photo} species={pet.nutrition.species} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{pet.name}</p>
                  <p className="text-[11px] text-muted-fg">
                    {t(`pets.species.${pet.nutrition.species}`)} · {pet.nutrition.weightKg} kg
                  </p>
                </div>
                <span
                  className={cn(
                    'h-5 w-5 shrink-0 rounded-full border flex items-center justify-center',
                    active ? 'border-primary bg-primary text-primary-fg' : 'border-border',
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 2 — Duration */}
      <Card padding="md" className="space-y-3">
        <SectionLabel>{t('mealPlan.wizard.duration')}</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => {
            const active = duration === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border p-4 transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
                )}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-black">{d} {t('mealPlan.wizard.days')}</span>
                <span className="text-[10px] text-muted-fg">{t(`mealPlan.wizard.duration_${d}`)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 3 — Sourcing */}
      <Card padding="md">
        <SourcingPicker value={sourcing} onChange={setSourcing} />
      </Card>

      {/* Step 4 — Name */}
      <Card padding="md">
        <Input
          label={t('mealPlan.wizard.nameLabel')}
          placeholder={defaultName(selectedPets, duration, t)}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={regenerate}
          disabled={selectedPets.length === 0}
        >
          <RotateCcw className="h-4 w-4" />
          {preview ? t('mealPlan.wizard.regenerate') : t('mealPlan.wizard.generate')}
        </Button>
        <Button
          type="button"
          variant="glow"
          size="lg"
          block
          onClick={save}
          disabled={!preview}
          className="sm:ml-auto sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {t('mealPlan.wizard.save')}
        </Button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4 pt-4 border-t border-border">
          <PageHeader
            eyebrow={t('mealPlan.wizard.previewEyebrow')}
            title={preview.name}
            description={t('mealPlan.wizard.previewSubtitle', { days: preview.durationDays })}
          />
          <NutrientCoverageCard plan={preview} pets={selectedPets} />
          <CalendarGrid plan={preview} pets={selectedPets} />
        </div>
      )}
    </div>
  );
}

function defaultName(
  pets: PetProfile[],
  duration: PlanDuration,
  t: (k: string, vals?: Record<string, unknown>) => string,
): string {
  if (pets.length === 0) return t('mealPlan.wizard.defaultNameEmpty');
  const names = pets.map((p) => p.name).join(' & ');
  return t('mealPlan.wizard.defaultName', { names, days: duration });
}

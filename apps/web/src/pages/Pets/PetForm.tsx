import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Trash2 } from 'lucide-react';
import {
  PetProfileSchema, newPetId,
  type PetProfile, type HealthCondition, type Species,
} from '@pawcook/shared';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { SectionLabel } from '../../components/ui/section-label';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { DogIcon, CatIcon } from '../../components/species/species-icons';
import { AllergyPicker } from '../../components/pets/AllergyPicker';
import { ConditionPicker } from '../../components/pets/ConditionPicker';
import { usePets } from '../../contexts/PetProfilesContext';
import { cn } from '../../lib/cn';

const DOG_DIET_KEYS = ['balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral'] as const;
const CAT_DIET_KEYS = ['cat_pmr', 'cat_frankenprey', 'cat_barf_lite', 'cat_whole_prey', 'cat_cooked_carnivore'] as const;

function defaultsForSpecies(species: Species): PetProfile {
  const now = new Date().toISOString();
  return {
    id: newPetId(),
    name: '',
    allergies: [],
    conditions: [],
    nutrition: {
      species,
      weightKg: species === 'cat' ? 4 : 20,
      age: 'adult',
      activityLevel: 'moderate',
      bodyCondition: 'ideal',
      reproductiveStatus: 'neutered',
      mealsPerDay: 2,
      macroProfile: species === 'cat' ? 'cat_pmr' : 'balanced_cooked',
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function PetForm({ existing }: { existing?: PetProfile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addPet, updatePet, removePet } = usePets();
  const isEdit = Boolean(existing);

  const {
    register, control, handleSubmit, watch, reset,
    formState: { errors, isDirty },
  } = useForm<PetProfile>({
    resolver: zodResolver(PetProfileSchema),
    defaultValues: existing ?? defaultsForSpecies('dog'),
  });

  const species = watch('nutrition.species');
  const dietKeys = species === 'cat' ? CAT_DIET_KEYS : DOG_DIET_KEYS;
  const ageGrowthLabel = species === 'cat' ? t('pets.age.kitten') : t('pets.age.puppy');
  const ageGrowthValue: 'puppy' | 'kitten' = species === 'cat' ? 'kitten' : 'puppy';

  // When species switches in a new-pet form, reset diet & age so they stay coherent.
  useEffect(() => {
    if (isEdit) return;
    reset((current) => ({
      ...defaultsForSpecies(current.nutrition.species),
      // preserve fields the user has already entered
      name: current.name,
      allergies: current.allergies,
      conditions: current.conditions,
    }));
  }, [species, isEdit, reset]);

  function onSubmit(data: PetProfile) {
    const now = new Date().toISOString();
    if (isEdit) {
      updatePet(data.id, { ...data, updatedAt: now });
      toast.success(t('pets.toast.updated', { name: data.name }));
      navigate(`/pets/${data.id}`);
    } else {
      addPet({ ...data, createdAt: now, updatedAt: now });
      toast.success(t('pets.toast.added', { name: data.name }));
      navigate(`/pets/${data.id}`);
    }
  }

  function onDelete() {
    if (!existing) return;
    if (!confirm(t('pets.confirmDelete', { name: existing.name }))) return;
    removePet(existing.id);
    toast.success(t('pets.toast.removed', { name: existing.name }));
    navigate('/pets');
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-7">
        {/* Species */}
        <div>
          <SectionLabel>{t('pets.form.species')}</SectionLabel>
          <Controller
            control={control}
            name="nutrition.species"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {(['dog', 'cat'] as const).map((sp) => {
                  const active = field.value === sp;
                  const Icon = sp === 'cat' ? CatIcon : DogIcon;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => field.onChange(sp)}
                      disabled={isEdit && sp !== existing?.nutrition.species}
                      className={cn(
                        'flex items-center gap-2.5 p-4 rounded-2xl border text-left transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-black">
                        {t(`pets.species.${sp}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {isEdit && (
            <p className="text-[11px] text-muted-fg mt-2">{t('pets.form.speciesLocked')}</p>
          )}
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('pets.form.name')}
            placeholder={species === 'cat' ? 'Whiskers' : 'Rex'}
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label={t('pets.form.weight')}
            type="number" step="0.1" inputMode="decimal"
            {...register('nutrition.weightKg', { valueAsNumber: true })}
            error={errors.nutrition?.weightKg?.message}
          />
        </div>

        {/* Body & lifestyle */}
        <div>
          <SectionLabel>{t('pets.form.lifestyleSection')}</SectionLabel>
          <div className="space-y-4 mt-3">
            <Select label={t('pets.form.age')} {...register('nutrition.age')}>
              <option value={ageGrowthValue}>{ageGrowthLabel}</option>
              <option value="adult">{t('pets.age.adult')}</option>
              <option value="senior">{t('pets.age.senior')}</option>
            </Select>

            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
                {t('pets.form.activity')}
              </span>
              <Controller
                control={control}
                name="nutrition.activityLevel"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    className="grid grid-cols-2 sm:grid-cols-4 w-full"
                  >
                    <ToggleGroupItem value="sedentary">{t('pets.activity.sedentary')}</ToggleGroupItem>
                    <ToggleGroupItem value="moderate">{t('pets.activity.moderate')}</ToggleGroupItem>
                    <ToggleGroupItem value="active">{t('pets.activity.active')}</ToggleGroupItem>
                    <ToggleGroupItem value="working">{t('pets.activity.working')}</ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
                {t('pets.form.bodyCondition')}
              </span>
              <Controller
                control={control}
                name="nutrition.bodyCondition"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    className="grid grid-cols-3 w-full"
                  >
                    <ToggleGroupItem value="underweight">{t('pets.bodyCondition.underweight')}</ToggleGroupItem>
                    <ToggleGroupItem value="ideal">{t('pets.bodyCondition.ideal')}</ToggleGroupItem>
                    <ToggleGroupItem value="overweight">{t('pets.bodyCondition.overweight')}</ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label={t('pets.form.reproStatus')} {...register('nutrition.reproductiveStatus')}>
                <option value="neutered">{t('pets.reproStatus.neutered')}</option>
                <option value="intact">{t('pets.reproStatus.intact')}</option>
                <option value="pregnant">{t('pets.reproStatus.pregnant')}</option>
                <option value="lactating">{t('pets.reproStatus.lactating')}</option>
              </Select>
              <Input
                label={t('pets.form.mealsPerDay')}
                type="number" min={1} max={4} inputMode="numeric"
                {...register('nutrition.mealsPerDay', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Diet profile */}
        <div>
          <SectionLabel>{t('pets.form.dietSection')}</SectionLabel>
          <Controller
            control={control}
            name="nutrition.macroProfile"
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
                {dietKeys.map((key) => {
                  const active = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border text-center',
                        'transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
                      )}
                    >
                      <span className="text-xs font-black leading-tight">
                        {t(`nutrition.dietShort.${key}`)}
                      </span>
                      <span className="text-[10px] text-muted-fg leading-tight">
                        {t(`nutrition.dietSub.${key}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.nutrition?.macroProfile?.message && (
            <p className="text-xs text-danger mt-2">{errors.nutrition.macroProfile.message}</p>
          )}
        </div>

        {/* Allergies */}
        <Controller
          control={control}
          name="allergies"
          render={({ field }) => (
            <AllergyPicker value={field.value ?? []} onChange={field.onChange} />
          )}
        />

        {/* Conditions */}
        <Controller
          control={control}
          name="conditions"
          render={({ field }) => (
            <ConditionPicker
              value={(field.value ?? []) as HealthCondition[]}
              onChange={field.onChange}
            />
          )}
        />

        {/* Notes */}
        <Input
          label={t('pets.form.notes')}
          placeholder={t('pets.form.notesPlaceholder')}
          {...register('notes')}
        />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          {isEdit && (
            <Button type="button" variant="ghost" onClick={onDelete} className="text-danger">
              <Trash2 className="h-4 w-4" />
              {t('pets.form.delete')}
            </Button>
          )}
          <Button type="submit" variant="glow" size="lg" block className="sm:ml-auto sm:w-auto" disabled={!isDirty && isEdit}>
            <Save className="h-4 w-4" />
            {isEdit ? t('pets.form.saveChanges') : t('pets.form.create')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

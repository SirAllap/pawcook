import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Trash2, AlertTriangle, ChefHat } from 'lucide-react';
import {
  PetProfileSchema, newPetId, getDietCookingDefaults,
  type PetProfile, type HealthCondition, type Species,
  type DogMacroProfile, type CookingPreparation,
} from '@pawcook/shared';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { SectionLabel } from '../../components/ui/section-label';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { Sheet } from '../../components/ui/sheet';
import { DogIcon, CatIcon } from '../../components/species/species-icons';
import { AllergyPicker } from '../../components/pets/AllergyPicker';
import { ConditionPicker } from '../../components/pets/ConditionPicker';
import { CustomDietPicker, DEFAULT_CUSTOM_DIET } from '../../components/pets/CustomDietPicker';
import { usePets } from '../../contexts/PetProfilesContext';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { useUnsavedGuard } from '../../lib/use-unsaved-guard';
import { blockBadNumberKeys } from '../../lib/number-input';
import { cn } from '../../lib/cn';

const DOG_DIET_KEYS = ['balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral', 'custom'] as const;
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
  const { removePetReferences } = useMealPlans();
  const isEdit = Boolean(existing);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pmrCookedDialog, setPmrCookedDialog] = useState(false);

  const {
    register, control, handleSubmit, watch, reset, setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PetProfile>({
    resolver: zodResolver(PetProfileSchema),
    mode: 'onBlur',
    defaultValues: existing ?? defaultsForSpecies('dog'),
  });

  useUnsavedGuard(isDirty && !isSubmitting);

  const species = watch('nutrition.species');
  const macroProfile = watch('nutrition.macroProfile');
  const cookingMethod = watch('nutrition.cookingMethod');
  const dietKeys = species === 'cat' ? CAT_DIET_KEYS : DOG_DIET_KEYS;
  // Cooking method axis is dog-only in this phase; cats inherit their
  // preset's cooking convention until the feline custom creator ships.
  // Guard against the species-switch render gap where species has flipped
  // to 'dog' but macroProfile is still a leftover cat preset (the reset
  // useEffect hasn't fired yet) — calling getDietCookingDefaults with a
  // cat profile id crashes the render.
  const isDogProfile = (DOG_DIET_KEYS as readonly string[]).includes(macroProfile);
  const cookingDefaults = species === 'dog' && isDogProfile
    ? getDietCookingDefaults(macroProfile as DogMacroProfile)
    : null;
  const effectiveCooking: CookingPreparation | undefined = cookingDefaults
    ? cookingMethod ?? cookingDefaults.defaultCookingMethod
    : undefined;
  const ageGrowthLabel = species === 'cat' ? t('pets.age.kitten') : t('pets.age.puppy');
  const ageGrowthValue: 'puppy' | 'kitten' = species === 'cat' ? 'kitten' : 'puppy';

  // When species switches in a new-pet form, reset diet & age so they stay
  // coherent — but preserve user-entered text (name, notes, allergies,
  // conditions) and any numeric values still valid for the new species.
  useEffect(() => {
    if (isEdit) return;
    reset((current) => ({
      ...defaultsForSpecies(current.nutrition.species),
      name: current.name,
      notes: current.notes,
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

  function doDelete() {
    if (!existing) return;
    removePetReferences(existing.id);
    removePet(existing.id);
    setConfirmDelete(false);
    toast.success(t('pets.toast.removed', { name: existing.name }));
    navigate('/pets');
  }

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-7">
          {/* Species */}
          <div>
            <SectionLabel>{t('pets.form.species')}</SectionLabel>
            <Controller
              control={control}
              name="nutrition.species"
              render={({ field }) => (
                <div role="radiogroup" aria-label={t('pets.form.species')} className="grid grid-cols-2 gap-2 mt-3">
                  {(['dog', 'cat'] as const).map((sp) => {
                    const active = field.value === sp;
                    const Icon = sp === 'cat' ? CatIcon : DogIcon;
                    const locked = isEdit && sp !== existing?.nutrition.species;
                    return (
                      <button
                        key={sp}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => !locked && field.onChange(sp)}
                        disabled={locked}
                        aria-label={locked ? t('pets.form.speciesLocked') : t(`pets.species.${sp}`)}
                        title={locked ? t('pets.form.speciesLocked') : undefined}
                        className={cn(
                          'flex items-center gap-2.5 p-4 rounded-2xl border text-left transition-colors',
                          'min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50',
                          active
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
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
              placeholder={t(species === 'cat' ? 'pets.form.namePlaceholderCat' : 'pets.form.namePlaceholderDog')}
              autoComplete="off"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label={t('pets.form.weight')}
              type="number" step="0.1" min={0.1} max={100} inputMode="decimal"
              onKeyDown={blockBadNumberKeys}
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
                      aria-label={t('pets.form.activity')}
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
                      aria-label={t('pets.form.bodyCondition')}
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
                  type="number" min={1} max={4} step={1} inputMode="numeric"
                  onKeyDown={blockBadNumberKeys}
                  {...register('nutrition.mealsPerDay', { valueAsNumber: true })}
                  error={errors.nutrition?.mealsPerDay?.message}
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
                <div
                  role="radiogroup"
                  aria-label={t('pets.form.dietSection')}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3"
                >
                  {dietKeys.map((key) => {
                    const active = field.value === key;
                    const isCustom = key === 'custom';
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          field.onChange(key);
                          // Lazily attach / clear the custom payload as the
                          // user moves in or out of the Custom chip.
                          if (isCustom) {
                            const current = watch('nutrition.customDiet');
                            if (!current) {
                              setValue('nutrition.customDiet', DEFAULT_CUSTOM_DIET, { shouldDirty: true });
                            }
                          } else {
                            setValue('nutrition.customDiet', undefined, { shouldDirty: true });
                          }
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border text-center',
                          'min-h-[44px] transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-foreground'
                            : isCustom
                              ? 'border-dashed border-border bg-surface-2 text-muted-fg hover:text-foreground'
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

            {/* Custom diet panel — expands inline when "+ Custom" is picked. */}
            {macroProfile === 'custom' && (
              <Controller
                control={control}
                name="nutrition.customDiet"
                render={({ field }) => (
                  <Controller
                    control={control}
                    name="nutrition.vetPrescription"
                    render={({ field: vetField }) => (
                      <CustomDietPicker
                        value={field.value ?? DEFAULT_CUSTOM_DIET}
                        onChange={field.onChange}
                        vetPrescription={vetField.value ?? undefined}
                        onVetPrescriptionChange={vetField.onChange}
                      />
                    )}
                  />
                )}
              />
            )}

            {/* Cooking method — dog-only for now. Orthogonal to the preset. */}
            {cookingDefaults && (
              <div className="space-y-2 mt-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
                  <ChefHat className="h-3 w-3" aria-hidden />
                  {t('pets.form.cookingMethod')}
                </span>
                <ToggleGroup
                  type="single"
                  value={effectiveCooking}
                  onValueChange={(v) => {
                    if (!v) return;
                    const next = v as CookingPreparation;
                    if (cookingDefaults.cookingLock && next !== cookingDefaults.cookingLock) {
                      setPmrCookedDialog(true);
                      return;
                    }
                    // Persist undefined when the user re-selects the canonical
                    // default so we don't bloat stored pet profiles with no-op state.
                    setValue(
                      'nutrition.cookingMethod',
                      next === cookingDefaults.defaultCookingMethod ? undefined : next,
                      { shouldDirty: true },
                    );
                  }}
                  aria-label={t('pets.form.cookingMethod')}
                  className="grid grid-cols-3 w-full"
                >
                  <ToggleGroupItem value="raw">{t('nutrition.cooking.raw')}</ToggleGroupItem>
                  <ToggleGroupItem value="lightly_cooked">{t('nutrition.cooking.lightly_cooked')}</ToggleGroupItem>
                  <ToggleGroupItem value="fully_cooked">{t('nutrition.cooking.fully_cooked')}</ToggleGroupItem>
                </ToggleGroup>
                {cookingMethod && cookingMethod !== cookingDefaults.defaultCookingMethod && (
                  <p className="text-[11px] text-warning leading-snug">
                    {t('nutrition.cooking.nonCanonical', {
                      preset: t(`nutrition.dietShort.${macroProfile}`),
                    })}
                  </p>
                )}
              </div>
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
            autoComplete="off"
            {...register('notes')}
          />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('pets.form.delete')}
              </Button>
            )}
            <Button
              type="submit"
              variant="glow"
              size="lg"
              block
              loading={isSubmitting}
              className="sm:ml-auto sm:w-auto"
              disabled={!isDirty && isEdit}
              title={!isDirty && isEdit ? t('pets.form.noChanges', { defaultValue: 'Make a change to enable save' }) : undefined}
            >
              {!isSubmitting && <Save className="h-4 w-4" aria-hidden />}
              {isEdit ? t('pets.form.saveChanges') : t('pets.form.create')}
            </Button>
          </div>
        </form>
      </Card>

      <Sheet
        open={pmrCookedDialog}
        onOpenChange={setPmrCookedDialog}
        title={
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
            {t('nutrition.cooking.pmrLockTitle')}
          </span>
        }
        description={t('nutrition.cooking.pmrLockBody')}
      >
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="glow"
            onClick={() => {
              setValue('nutrition.macroProfile', 'barf', { shouldDirty: true });
              setValue('nutrition.cookingMethod', 'fully_cooked', { shouldDirty: true });
              setPmrCookedDialog(false);
            }}
            block
          >
            {t('nutrition.cooking.pmrLockSwitchBarf')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPmrCookedDialog(false)} block>
            {t('nutrition.cooking.pmrLockKeepRaw')}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
            {t('pets.confirmDelete', { name: existing?.name ?? '' })}
          </span>
        }
        description={t('pets.confirmDeleteHelp', {
          defaultValue:
            'This permanently removes the pet and unlinks them from any meal plans.',
        })}
      >
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)} block>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="button" variant="destructive" onClick={doDelete} block>
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('pets.form.delete')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

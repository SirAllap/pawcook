import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../lib/toast';
import { Download, Upload, Database, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { usePets } from '../../contexts/PetProfilesContext';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { exportAllData, parseBackupFile } from '../../lib/data-portability';

type ImportMode = 'replace' | 'merge';

export function DataPortability() {
  const { t } = useTranslation();
  const { pets, addPet, removePet } = usePets();
  const { plans, addPlan, removePlan } = useMealPlans();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingModeRef = useRef<ImportMode>('merge');
  const [importing, setImporting] = useState(false);

  function handleExport() {
    if (pets.length === 0 && plans.length === 0) {
      toast.info(t('data.nothingToExport'));
      return;
    }
    exportAllData(pets, plans);
    toast.success(t('data.exportSuccess', {
      pets: pets.length,
      plans: plans.length,
    }));
  }

  async function handleFile(file: File, mode: ImportMode) {
    setImporting(true);
    try {
      const result = await parseBackupFile(file);
      if (!result.ok) {
        toast.error(t(`data.import.error.${result.reason}`, {
          defaultValue: t('data.import.error.generic'),
        }));
        return;
      }

      if (mode === 'replace') {
        for (const p of pets) removePet(p.id);
        for (const pl of plans) removePlan(pl.id);
      }

      for (const pet of result.pets) addPet(pet);
      for (const plan of result.mealPlans) addPlan(plan);

      const skipped = result.skippedPets + result.skippedPlans;
      if (skipped > 0) {
        toast.warning(t('data.importPartial', {
          pets: result.pets.length,
          plans: result.mealPlans.length,
          skipped,
        }));
      } else {
        toast.success(t('data.importSuccess', {
          pets: result.pets.length,
          plans: result.mealPlans.length,
        }));
      }
    } finally {
      setImporting(false);
      // Reset so picking the same file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onImportClick() {
    if (importing) return;
    const hasExisting = pets.length > 0 || plans.length > 0;
    if (hasExisting) {
      const replace = confirm(t('data.importConfirm.replaceOrMerge'));
      pendingModeRef.current = replace ? 'replace' : 'merge';
    } else {
      pendingModeRef.current = 'merge';
    }
    fileInputRef.current?.click();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file, pendingModeRef.current);
  }

  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black tracking-tight">{t('data.title')}</h3>
      </div>
      <p className="text-xs text-muted-fg leading-relaxed">
        {t('data.help')}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" />
          {t('data.export')}
        </Button>
        <Button type="button" variant="secondary" onClick={onImportClick} disabled={importing}>
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {t('data.import.cta')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onFileChange}
          className="sr-only"
          aria-hidden
        />
      </div>
    </Card>
  );
}

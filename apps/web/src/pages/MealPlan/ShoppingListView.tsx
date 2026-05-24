import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChefHat, ShoppingBag } from 'lucide-react';
import {
  getStoreSection, MeatTypeSchema,
  type MealPlan, type PetProfile, type ShoppingItem,
} from '@pawcook/shared';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { DownloadMenu } from '../../components/recipe/DownloadMenu';
import { PetTag } from '../../components/meal-plan/PetTag';
import { useRecipeExport } from '../../hooks/useRecipeExport';
import { useShoppingChecks } from '../../contexts/ShoppingChecksContext';
import { useTranslateIngredient } from '../../lib/translate-ingredient';
import { setPendingCookingPrefill } from '../../lib/cooking-prefill-bridge';
import { cn } from '../../lib/cn';
import type { CookingPrefill } from '../CookingCalculator';

export function ShoppingListView({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getChecks, toggle } = useShoppingChecks();
  const checked = getChecks(plan.id);
  const { setTarget, downloadPdf, downloadImage, busy } = useRecipeExport();
  const translateIngredient = useTranslateIngredient();

  function openCookingFor(item: ShoppingItem) {
    const meat = MeatTypeSchema.safeParse(item.ingredientId);
    const totalWeightKg = Math.max(0.1, Math.min(30, item.totalGrams / 1000));
    const prefill: CookingPrefill = {
      meatType: meat.success ? meat.data : undefined,
      totalWeightKg,
      planName: plan.name,
      petCount: item.forPetIds.length,
      feedingDays: plan.durationDays,
      cookingMethod: plan.sourcing.preferredCookingMethod,
    };
    // Hand off via the module-level bridge (in-memory, cannot fail) AND
    // localStorage as a backup. CookingCalculator's consume reads both
    // tiers so we cover lazy-load timing and storage-blocked browsers.
    setPendingCookingPrefill(prefill);
    navigate('/cooking');
  }

  const exportConfig = useMemo(() => ({
    prefix: 'pawcook-shopping',
    parts: [plan.name, `${plan.durationDays}d`],
    footer: t('mealPlan.shopping.exportFooter', {
      defaultValue: 'PawCook shopping list — not veterinary advice.',
    }),
  }), [plan, t]);

  if (plan.shoppingList.sections.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title={t('mealPlan.shopping.emptyTitle', { defaultValue: 'Nothing to buy yet' })}
        description={t('mealPlan.shopping.empty')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="md" className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
            {t('mealPlan.shopping.total')}
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {t('mealPlan.shopping.totalSummary', {
              items: plan.shoppingList.totals.itemCount,
              grams: plan.shoppingList.totals.totalGrams,
            })}
          </p>
        </div>
        <DownloadMenu
          busy={busy}
          onDownloadPdf={() => downloadPdf(exportConfig)}
          onDownloadImage={() => downloadImage(exportConfig)}
        />
      </Card>

      <div ref={setTarget} className="space-y-4">
        {plan.shoppingList.sections.map((section) => {
          const meta = getStoreSection(section.sectionId);
          return (
            <Card key={section.sectionId} padding="none" className="overflow-hidden">
              <header className="flex items-center justify-between gap-3 p-4 border-b border-border bg-surface-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
                  <p className="text-sm font-black text-foreground">
                    {t(`mealPlan.shopping.section.${section.sectionId}`, {
                      defaultValue: meta?.label ?? section.sectionId,
                    })}
                  </p>
                </div>
                <Badge variant="neutral" className="text-[10px]">
                  {section.items.length}
                </Badge>
              </header>
              <ul className="divide-y divide-border/50">
                {section.items.map((item) => {
                  const key = `${section.sectionId}:${item.ingredientId}`;
                  const isChecked = checked.has(key);
                  const isMeat = MeatTypeSchema.safeParse(item.ingredientId).success;
                  return (
                    <ShoppingRow
                      key={item.ingredientId}
                      item={item}
                      label={translateIngredient(item.ingredientId)}
                      lang={i18n.language}
                      pets={pets}
                      checked={isChecked}
                      onToggle={() => toggle(plan.id, key)}
                      onCook={isMeat ? () => openCookingFor(item) : undefined}
                    />
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ShoppingRow({
  item, label, lang, pets, checked, onToggle, onCook,
}: {
  item: ShoppingItem;
  label: string;
  lang: string;
  pets: PetProfile[];
  checked: boolean;
  onToggle: () => void;
  onCook?: () => void;
}) {
  const { t } = useTranslation();
  const itemPets = pets.filter((p) => item.forPetIds.includes(p.id));
  const allPets = item.forPetIds.length === pets.length;

  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`${label} — ${formatQuantity(item.totalGrams, lang)}`}
        className={cn(
          'flex-1 min-w-0 flex items-center gap-3 p-3 text-left transition-colors',
          'min-h-[44px] hover:bg-surface-2 active:bg-surface-3',
          checked && 'opacity-60',
        )}
      >
        <span
          className={cn(
            'h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
            checked ? 'border-success bg-success text-success-fg' : 'border-border',
          )}
          aria-hidden
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-bold text-foreground',
              checked && 'line-through text-muted-fg',
            )}
          >
            {label}
          </p>
          {!allPets && itemPets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {itemPets.map((p) => <PetTag key={p.id} pet={p} />)}
            </div>
          )}
        </div>
        <span className="text-sm font-mono font-bold tabular-nums text-foreground shrink-0">
          {formatQuantity(item.totalGrams, lang)}
        </span>
      </button>
      {onCook && (
        <button
          type="button"
          onClick={onCook}
          aria-label={t('mealPlan.shopping.cookWith', {
            defaultValue: 'Cook {{name}} ({{qty}})',
            name: label,
            qty: formatQuantity(item.totalGrams, lang),
          })}
          title={t('mealPlan.shopping.cookWith', {
            defaultValue: 'Cook {{name}} ({{qty}})',
            name: label,
            qty: formatQuantity(item.totalGrams, lang),
          })}
          className="shrink-0 flex flex-col items-center justify-center gap-0.5 w-16 border-l border-border/60 text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors min-h-[44px] font-bold"
        >
          <ChefHat className="h-4 w-4" aria-hidden />
          <span className="text-[10px] uppercase tracking-wider">
            {t('mealPlan.shopping.cookShort', { defaultValue: 'Cook' })}
          </span>
        </button>
      )}
    </li>
  );
}

function formatQuantity(grams: number, lang: string): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString(lang, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} kg`;
  }
  return `${grams.toLocaleString(lang)} g`;
}

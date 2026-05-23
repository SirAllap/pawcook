import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ShoppingBag } from 'lucide-react';
import { getIngredient, getStoreSection, type MealPlan, type PetProfile, type ShoppingItem } from '@pawcook/shared';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { DownloadMenu } from '../../components/recipe/DownloadMenu';
import { PetTag } from '../../components/meal-plan/PetTag';
import { useRecipeExport } from '../../hooks/useRecipeExport';
import { cn } from '../../lib/cn';

export function ShoppingListView({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const { setTarget, downloadPdf, downloadImage, busy } = useRecipeExport();

  const exportConfig = useMemo(() => ({
    prefix: 'pawcook-shopping',
    parts: [plan.name, `${plan.durationDays}d`],
    footer: t('mealPlan.shopping.exportFooter', {
      defaultValue: 'PawCook shopping list — not veterinary advice.',
    }),
  }), [plan, t]);

  function toggleChecked(itemKey: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  }

  if (plan.shoppingList.sections.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-muted-fg">{t('mealPlan.shopping.empty')}</p>
      </Card>
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
                  <ShoppingBag className="h-4 w-4 text-primary" />
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
                  return (
                    <ShoppingRow
                      key={item.ingredientId}
                      item={item}
                      pets={pets}
                      checked={isChecked}
                      onToggle={() => toggleChecked(key)}
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
  item, pets, checked, onToggle,
}: {
  item: ShoppingItem;
  pets: PetProfile[];
  checked: boolean;
  onToggle: () => void;
}) {
  const ingredient = getIngredient(item.ingredientId);
  const itemPets = pets.filter((p) => item.forPetIds.includes(p.id));
  const allPets = item.forPetIds.length === pets.length;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 p-3 text-left transition-colors',
          'hover:bg-surface-2 active:bg-surface-3',
          checked && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors',
            checked ? 'border-success bg-success text-success-fg' : 'border-border',
          )}
        >
          {checked && <Check className="h-3 w-3" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold text-foreground', checked && 'line-through')}>
            {ingredient?.label ?? item.ingredientId}
          </p>
          {!allPets && itemPets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {itemPets.map((p) => <PetTag key={p.id} pet={p} />)}
            </div>
          )}
        </div>
        <span className="text-sm font-mono font-bold tabular-nums text-foreground shrink-0">
          {formatQuantity(item.totalGrams)}
        </span>
      </button>
    </li>
  );
}

function formatQuantity(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}

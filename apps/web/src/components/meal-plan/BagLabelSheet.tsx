import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CookingBatch, MealPlan, PetProfile } from '@pawcook/shared';
import { useTranslateIngredient } from '../../lib/translate-ingredient';

/**
 * Print-friendly label sheet for sous-vide bags. Renders one label per
 * batch in a grid that approximates Avery 5163 (2x4 inches, 10 per page).
 * Triggers window.print() on mount so the user gets the print dialog
 * straight away; closing it returns to the cooking plan view.
 */
export function BagLabelSheet({
  plan,
  pets,
  batches,
  onClose,
}: {
  plan: MealPlan;
  pets: PetProfile[];
  batches: CookingBatch[];
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const translateIngredient = useTranslateIngredient();
  const printed = useRef(false);

  useEffect(() => {
    if (printed.current) return;
    printed.current = true;
    // Defer one frame so the labels paint before the dialog opens.
    requestAnimationFrame(() => window.print());
  }, []);

  useEffect(() => {
    function handler() {
      onClose();
    }
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, [onClose]);

  function petNames(ids: string[]): string {
    return pets
      .filter((p) => ids.includes(p.id))
      .map((p) => p.name)
      .join(', ');
  }

  function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <div className="print-sheet bg-white text-black p-4">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible; }
          .print-sheet { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print mb-4 flex items-center justify-between gap-3 text-sm">
        <p className="font-bold">
          {t('mealPlan.labels.title', {
            defaultValue: '{{count}} bag labels — {{plan}}',
            count: batches.length,
            plan: plan.name,
          })}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-bold hover:bg-gray-100"
        >
          {t('common.close', { defaultValue: 'Close' })}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="border border-black p-2 break-inside-avoid"
            style={{ minHeight: '2in' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black uppercase leading-tight">
                {translateIngredient(batch.ingredientId)}
              </p>
              <p className="text-xs font-bold tabular-nums">
                {t('mealPlan.labels.bagN', {
                  defaultValue: 'Bag {{n}}/{{total}}',
                  n: batch.sequence,
                  total: batch.totalInSequence,
                })}
              </p>
            </div>
            <dl className="mt-1.5 text-[11px] font-mono leading-snug space-y-0.5">
              <div>
                <dt className="inline font-bold">
                  {t('mealPlan.labels.cooked', { defaultValue: 'Cooked' })}:
                </dt>{' '}
                <dd className="inline">{fmtDate(batch.cookDate)}</dd>
              </div>
              <div>
                <dt className="inline font-bold">
                  {t('mealPlan.labels.useBy', { defaultValue: 'Use by' })}:
                </dt>{' '}
                <dd className="inline">{fmtDate(batch.useByDate)}</dd>
              </div>
              <div>
                <dt className="inline font-bold">
                  {t('mealPlan.labels.serves', { defaultValue: 'Serves' })}:
                </dt>{' '}
                <dd className="inline">{batch.dates.map(fmtDate).join(', ')}</dd>
              </div>
              <div>
                <dt className="inline font-bold">
                  {t('mealPlan.labels.pets', { defaultValue: 'Pets' })}:
                </dt>{' '}
                <dd className="inline">{petNames(batch.forPetIds)}</dd>
              </div>
              <div>
                <dt className="inline font-bold">
                  {t('mealPlan.labels.weight', { defaultValue: 'Weight' })}:
                </dt>{' '}
                <dd className="inline">{batch.totalGrams} g</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

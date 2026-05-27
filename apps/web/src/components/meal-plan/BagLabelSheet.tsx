import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Copy, Check, X, Info } from 'lucide-react';
import type { CookingBatch, MealPlan, PetProfile } from '@pawcook/shared';
import { useTranslateIngredient } from '../../lib/translate-ingredient';
import { computeBatchPortions } from '../../lib/batch-portions';
import { Button } from '../ui/button';

/**
 * Sharpie-this-bag stepper. One bag at a time, on-screen — no printing.
 * Permanent marker on the bag (or a strip of painter's tape for silicone
 * bags) is the median home's labelling channel; printer ownership is a
 * showcase-home assumption (CLAUDE.md sub-#5).
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
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const sorted = useMemo(
    () => [...batches].sort((a, b) => a.sequence - b.sequence),
    [batches],
  );
  const batch = sorted[index];

  useEffect(() => {
    setCopied(false);
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
      if (e.key === 'ArrowRight' && index < sorted.length - 1) setIndex(index + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, sorted.length, onClose]);

  if (!batch) {
    onClose();
    return null;
  }

  const portions = computeBatchPortions(plan, batch);
  const labelText = buildLabelText({
    ingredient: translateIngredient(batch.ingredientId),
    sequence: batch.sequence,
    total: batch.totalInSequence,
    grams: batch.totalGrams,
    cookDate: fmtDate(batch.cookDate, i18n.language),
    useByDate: fmtDate(batch.useByDate, i18n.language),
    portions,
    pets,
    cookedLabel: t('mealPlan.sharpie.cookedShort', { defaultValue: 'Cooked' }),
    useByLabel: t('mealPlan.sharpie.useByShort', { defaultValue: 'Use by' }),
  });

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(labelText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Older Safari / non-secure contexts — fall through silently. The
      // text is still visible on screen for the user to retype.
    }
  }

  const isLast = index === sorted.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t('mealPlan.sharpie.title', { n: batch.sequence, total: batch.totalInSequence, defaultValue: 'Label bag {{n}}/{{total}}' })}
    >
      <div className="mx-auto max-w-md p-4 sm:p-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
              {t('mealPlan.sharpie.progress', { n: index + 1, total: sorted.length, defaultValue: '{{n}} of {{total}}' })}
            </p>
            <p className="text-base font-black text-foreground">
              {t('mealPlan.sharpie.title', { n: batch.sequence, total: batch.totalInSequence, defaultValue: 'Label bag {{n}}/{{total}}' })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/70 hover:bg-surface-2"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <p className="text-sm text-muted-fg">
          {t('mealPlan.sharpie.intro', { defaultValue: 'Copy this onto the bag with a permanent marker. One bag at a time.' })}
        </p>

        {/* The label preview — big, monospace, mimics what the user writes
            on the actual bag. Sized for legibility while standing at the
            counter with wet hands. */}
        <div className="rounded-2xl border-2 border-foreground bg-white text-black p-5 font-mono leading-tight whitespace-pre-line text-base sm:text-lg select-text">
          {labelText}
        </div>

        <Button
          type="button"
          variant={copied ? 'secondary' : 'primary'}
          onClick={copyToClipboard}
          block
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              {t('mealPlan.sharpie.copied', { defaultValue: 'Copied' })}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              {t('mealPlan.sharpie.copy', { defaultValue: 'Copy text' })}
            </>
          )}
        </Button>

        <p className="flex items-start gap-2 text-[11px] text-muted-fg">
          <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
          {t('mealPlan.sharpie.tipTape', {
            defaultValue: "Reusable silicone bag? Stick a strip of masking tape on it and write on that.",
          })}
        </p>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t('mealPlan.sharpie.prev', { defaultValue: 'Previous bag' })}
          </Button>
          {isLast ? (
            <Button type="button" variant="primary" onClick={onClose}>
              <Check className="h-4 w-4" aria-hidden />
              {t('mealPlan.sharpie.done', { defaultValue: 'Done' })}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIndex((i) => Math.min(sorted.length - 1, i + 1))}
            >
              {t('mealPlan.sharpie.next', { defaultValue: 'Next bag' })}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtDate(iso: string, locale: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

function buildLabelText({
  ingredient,
  sequence,
  total,
  grams,
  cookDate,
  useByDate,
  portions,
  pets,
  cookedLabel,
  useByLabel,
}: {
  ingredient: string;
  sequence: number;
  total: number;
  grams: number;
  cookDate: string;
  useByDate: string;
  portions: { petId: string; grams: number }[];
  pets: PetProfile[];
  cookedLabel: string;
  useByLabel: string;
}): string {
  const nameById = new Map(pets.map((p) => [p.id, p.name]));
  const bagLine = total > 1 ? `${ingredient.toUpperCase()}  ${sequence}/${total}` : ingredient.toUpperCase();
  const lines = [
    bagLine,
    `${grams} g · ${cookedLabel} ${cookDate}`,
    `${useByLabel} ${useByDate}`,
  ];
  if (portions.length > 0) {
    for (const p of portions) {
      const name = nameById.get(p.petId);
      if (name && p.grams > 0) lines.push(`  ${name}: ${p.grams} g`);
    }
  } else {
    const names = pets.map((p) => p.name).join(', ');
    if (names) lines.push(names);
  }
  return lines.join('\n');
}

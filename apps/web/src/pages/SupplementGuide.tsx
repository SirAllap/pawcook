import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { AlertTriangle, Pill, RefreshCw, ShoppingCart, Bone, Fish, Leaf, Zap } from 'lucide-react';
import supplementsData from '@pawcook/data/supplements';
import aafcoData from '@pawcook/data/aafco';
import transitionData from '@pawcook/data/transition';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FadeIn } from '../components/motion/fade-in';

interface SupplementSource { id: string; label: string; dose: string; }
interface Supplement       { id: string; label: string; target: string; sources: SupplementSource[]; }
interface AafcoNutrient {
  id: string; label: string; unit: string;
  adultMin: number | null; growthMin: number | null; max: number | null;
}
interface AafcoRatio { id: string; label: string; min: string; max: string; note: string; }
interface AafcoTable { source: string; nutrients: AafcoNutrient[]; ratios: AafcoRatio[]; }
interface TransitionDay { days: string; oldPct: number; newPct: number; note: string; }
interface TransitionData { title: string; summary: string; days: TransitionDay[]; tips: string[]; }

const supplements = supplementsData as Supplement[];
const aafco       = aafcoData as AafcoTable;
const transition  = transitionData as TransitionData;

const COMMERCIAL_BALANCERS = [
  { name: 'Balance IT',                                       descKey: 'supplements.bal.balanceIt' },
  { name: 'Wysong Call of the Wild',                          descKey: 'supplements.bal.wysong' },
  { name: 'Animal Essentials Complete Multivitamin & Mineral',descKey: 'supplements.bal.animalEssentials' },
  { name: 'Volhard NDF2',                                     descKey: 'supplements.bal.volhard' },
];

const SUPP_ICONS = [Bone, Fish, Pill, Leaf, Zap];

function fmt(v: number | null) {
  if (v === null) return '—';
  if (v >= 1000) return v.toLocaleString();
  return String(v);
}

export default function SupplementGuide() {
  const { t } = useTranslation();

  return (
    <div className="space-y-7 sm:space-y-9">
      <PageHeader
        eyebrow={t('supplements.eyebrow', { defaultValue: 'Supplements' })}
        title={t('supplements.title')}
        description={t('supplements.subtitle')}
      />

      <FadeIn>
        <Card padding="md" className="border-l-[3px] border-l-primary">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">{t('supplements.caRatio')}</p>
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="font-black text-base">
              {t('supplements.aafcoTable.title', { defaultValue: 'AAFCO Nutrient Profile' })}
            </h2>
            <p className="text-xs text-muted-fg mt-0.5">
              {t('supplements.aafcoTable.source', { defaultValue: aafco.source })}
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-muted-fg bg-surface-2/50">
                  <th className="text-left font-bold px-4 py-2.5">{t('supplements.aafcoTable.nutrient', { defaultValue: 'Nutrient' })}</th>
                  <th className="text-right font-bold px-3 py-2.5">{t('supplements.aafcoTable.unit', { defaultValue: 'Unit' })}</th>
                  <th className="text-right font-bold px-3 py-2.5">{t('supplements.aafcoTable.adultMin', { defaultValue: 'Adult' })}</th>
                  <th className="text-right font-bold px-3 py-2.5">{t('supplements.aafcoTable.growthMin', { defaultValue: 'Growth' })}</th>
                  <th className="text-right font-bold px-4 py-2.5">{t('supplements.aafcoTable.safeMax', { defaultValue: 'Max' })}</th>
                </tr>
              </thead>
              <tbody>
                {aafco.nutrients.map((n, i) => (
                  <tr key={n.id} className={i % 2 ? 'bg-surface-2/30' : ''}>
                    <td className="px-4 py-2 font-semibold text-foreground">
                      {t(`supplements.aafcoTable.nutrients.${n.id}`, { defaultValue: n.label })}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-fg font-mono">{n.unit}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-primary tabular-nums">{fmt(n.adultMin)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-primary tabular-nums">{fmt(n.growthMin)}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-danger tabular-nums">{fmt(n.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-border space-y-2">
            {aafco.ratios.map((r) => (
              <div key={r.id} className="text-sm">
                <span className="font-bold text-foreground">
                  {t(`supplements.aafcoTable.ratios.${r.id}.label`, { defaultValue: r.label })}:
                </span>{' '}
                <span className="text-success font-mono font-semibold">{r.min} – {r.max}</span>
                <p className="text-xs text-muted-fg mt-0.5">
                  {t(`supplements.aafcoTable.ratios.${r.id}.note`, { defaultValue: r.note })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="font-black text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              {t('supplements.transition.title', { defaultValue: transition.title })}
            </h2>
            <p className="text-xs text-muted-fg mt-1 leading-relaxed">
              {t('supplements.transition.summary', { defaultValue: transition.summary })}
            </p>
          </header>
          <div className="p-4 space-y-3">
            {transition.days.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-surface-2 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-primary">
                    {t(`supplements.transition.days.${i}.label`, { defaultValue: d.days })}
                  </span>
                  <span className="text-[11px] font-bold text-muted-fg font-mono tabular-nums">
                    {t('supplements.transition.oldFresh', { old: d.oldPct, new: d.newPct, defaultValue: `${d.oldPct}% old · ${d.newPct}% new` })}
                  </span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.oldPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                    className="bg-muted-fg/40"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.newPct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                    className="bg-primary"
                  />
                </div>
                <p className="text-xs text-muted-fg mt-2 leading-relaxed">
                  {t(`supplements.transition.days.${i}.note`, { defaultValue: d.note })}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg mb-1">
              {t('supplements.transition.tipsTitle', { defaultValue: 'Tips' })}
            </p>
            {transition.tips.map((tip, i) => (
              <p key={i} className="text-xs text-muted-fg leading-relaxed flex gap-2">
                <span className="text-primary font-black shrink-0">•</span>
                {t(`supplements.transition.tips.${i}`, { defaultValue: tip })}
              </p>
            ))}
          </div>
        </Card>
      </FadeIn>

      <div className="space-y-4">
        {supplements.map((supp, si) => {
          const Icon = SUPP_ICONS[si] ?? Pill;
          return (
            <FadeIn key={supp.id} delay={si * 0.05}>
              <Card padding="none" variant="elevated" className="overflow-hidden">
                <header className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base">{t(`suppData.${supp.id}.label`, { defaultValue: supp.label })}</h2>
                    <p className="text-xs text-muted-fg mt-0.5">
                      <span className="text-foreground/80 font-semibold">{t('common.target')}:</span>{' '}
                      {t(`suppData.${supp.id}.target`, { defaultValue: supp.target })}
                    </p>
                  </div>
                </header>
                <div className="p-4 space-y-2">
                  {supp.sources.map((src) => (
                    <div key={src.id} className="rounded-2xl border border-border bg-surface-2 p-4">
                      <p className="text-sm font-bold">
                        {t(`suppData.${supp.id}.sources.${src.id}.label`, { defaultValue: src.label })}
                      </p>
                      <p className="text-xs text-muted-fg mt-1">
                        <span className="font-semibold">{t('supplements.dose')}:</span>{' '}
                        <span className="font-mono">{t(`suppData.${supp.id}.sources.${src.id}.dose`, { defaultValue: src.dose })}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          );
        })}
      </div>

      <FadeIn>
        <Card padding="none" variant="elevated" className="overflow-hidden">
          <header className="px-5 py-4 border-b border-border">
            <h2 className="font-black text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {t('supplements.commercialBalancers')}
            </h2>
          </header>
          <div className="p-4 space-y-2">
            {COMMERCIAL_BALANCERS.map(({ name, descKey }) => (
              <div key={name} className="rounded-2xl border border-border bg-surface-2 p-4 flex gap-3 items-start">
                <Badge variant="primary" className="shrink-0">→</Badge>
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-muted-fg mt-1">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

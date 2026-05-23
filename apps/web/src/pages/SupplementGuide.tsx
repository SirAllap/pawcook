import { useTranslation } from 'react-i18next';
import supplementsData from '@pawcook/data/supplements';
import aafcoData from '@pawcook/data/aafco';
import transitionData from '@pawcook/data/transition';

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
const aafco = aafcoData as AafcoTable;
const transition = transitionData as TransitionData;

const COMMERCIAL_BALANCERS: { name: string; descKey: string }[] = [
  { name: 'Balance IT',                                       descKey: 'supplements.bal.balanceIt' },
  { name: 'Wysong Call of the Wild',                          descKey: 'supplements.bal.wysong' },
  { name: 'Animal Essentials Complete Multivitamin & Mineral',descKey: 'supplements.bal.animalEssentials' },
  { name: 'Volhard NDF2',                                     descKey: 'supplements.bal.volhard' },
];

const SUPP_ICONS: Record<number, string> = { 0: '🦴', 1: '🐟', 2: '💊', 3: '🌿', 4: '⚡' };

function fmt(v: number | null): string {
  if (v === null) return '—';
  if (v >= 1000) return v.toLocaleString();
  return String(v);
}

export default function SupplementGuide() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{t('supplements.title')}</h1>
        <p className="text-gray-400 text-sm">{t('supplements.subtitle')}</p>
      </div>

      {/* Ca:P callout */}
      <div className="glass-card rounded-2xl p-5 border-l-[3px] border-amber-500/70 animate-fade-in-up delay-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <p className="text-sm text-amber-200 leading-relaxed">{t('supplements.caRatio')}</p>
        </div>
      </div>

      {/* AAFCO/FEDIAF reference table */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-150">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-black text-base text-white flex items-center gap-2">📋 AAFCO Nutrient Profile</h2>
          <p className="text-xs text-gray-500 mt-1">{aafco.source}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.05] text-gray-400">
                <th className="text-left font-bold px-4 py-2.5">Nutrient</th>
                <th className="text-right font-bold px-3 py-2.5">Unit</th>
                <th className="text-right font-bold px-3 py-2.5">Adult min</th>
                <th className="text-right font-bold px-3 py-2.5">Growth min</th>
                <th className="text-right font-bold px-4 py-2.5">Safe max</th>
              </tr>
            </thead>
            <tbody>
              {aafco.nutrients.map((n, i) => (
                <tr key={n.id} className={`border-b border-white/[0.03] ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-2 font-semibold text-gray-200">{n.label}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{n.unit}</td>
                  <td className="px-3 py-2 text-right text-amber-300/90 font-semibold">{fmt(n.adultMin)}</td>
                  <td className="px-3 py-2 text-right text-amber-300/90 font-semibold">{fmt(n.growthMin)}</td>
                  <td className="px-4 py-2 text-right text-red-300/80 font-semibold">{fmt(n.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-white/[0.05] space-y-2">
          {aafco.ratios.map(r => (
            <div key={r.id} className="text-sm">
              <span className="font-bold text-white">{r.label}:</span>{' '}
              <span className="text-green-300 font-semibold">{r.min} – {r.max}</span>
              <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day transition protocol */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-200">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-black text-base text-white flex items-center gap-2">🔄 {transition.title}</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{transition.summary}</p>
        </div>
        <div className="p-4 space-y-2.5">
          {transition.days.map((d, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-black text-amber-300">{d.days}</span>
                <span className="text-[11px] font-bold text-gray-500">
                  {d.oldPct}% old · {d.newPct}% fresh
                </span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.05]">
                <div className="bg-gray-600 transition-all" style={{ width: `${d.oldPct}%` }} />
                <div className="bg-gradient-to-r from-amber-600 to-amber-400 transition-all" style={{ width: `${d.newPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{d.note}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-white/[0.05] space-y-1.5">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">Tips</p>
          {transition.tips.map((tip, i) => (
            <p key={i} className="text-xs text-gray-400 leading-relaxed flex gap-2">
              <span className="text-amber-500 shrink-0 font-black">•</span>{tip}
            </p>
          ))}
        </div>
      </div>

      {/* Supplement cards */}
      <div className="space-y-4">
        {supplements.map((supp, si) => (
          <div key={supp.id}
            className="glass-card rounded-3xl overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${250 + si * 80}ms` }}>
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <span className="text-2xl">{SUPP_ICONS[si] ?? '💊'}</span>
              <div>
                <h2 className="font-black text-base text-white leading-snug">{t(`suppData.${supp.id}.label`, {defaultValue: supp.label})}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="text-gray-300 font-semibold">{t('common.target')}:</span> {t(`suppData.${supp.id}.target`, {defaultValue: supp.target})}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {supp.sources.map(src => (
                <div key={src.id} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3.5">
                  <p className="text-sm font-bold text-gray-100">{t(`suppData.${supp.id}.sources.${src.id}.label`, {defaultValue: src.label})}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-gray-500 font-semibold">{t('supplements.dose')}:</span>{' '}
                    {t(`suppData.${supp.id}.sources.${src.id}.dose`, {defaultValue: src.dose})}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Commercial balancers */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-500">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-black text-base text-white">🛒 {t('supplements.commercialBalancers')}</h2>
        </div>
        <div className="p-4 space-y-2">
          {COMMERCIAL_BALANCERS.map(({ name, descKey }) => (
            <div key={name} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3.5 flex gap-3 items-start">
              <span className="text-amber-500 shrink-0 mt-0.5 font-black text-base">→</span>
              <div>
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

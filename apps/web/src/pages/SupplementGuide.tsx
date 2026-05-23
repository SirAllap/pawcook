import { useTranslation } from 'react-i18next';
import supplementsData from '@pawcook/data/supplements';

interface SupplementSource { id: string; label: string; dose: string; }
interface Supplement       { id: string; label: string; target: string; sources: SupplementSource[]; }

const supplements = supplementsData as Supplement[];

const COMMERCIAL_BALANCERS: { name: string; descKey: string }[] = [
  { name: 'Balance IT',                                     descKey: 'supplements.bal.balanceIt' },
  { name: 'Wysong Call of the Wild',                        descKey: 'supplements.bal.wysong' },
  { name: 'Animal Essentials Complete Multivitamin & Mineral', descKey: 'supplements.bal.animalEssentials' },
  { name: 'Volhard NDF2',                                   descKey: 'supplements.bal.volhard' },
];

const SUPP_ICONS: Record<number, string> = { 0: '🦴', 1: '🐟', 2: '💊', 3: '🌿', 4: '⚡' };

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

      {/* Supplement cards */}
      <div className="space-y-4">
        {supplements.map((supp, si) => (
          <div key={supp.id}
            className="glass-card rounded-3xl overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${150 + si * 80}ms` }}>
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

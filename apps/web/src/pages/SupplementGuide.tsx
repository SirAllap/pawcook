import { useTranslation } from 'react-i18next';
import supplementsData from '@pawcook/data/supplements';

interface SupplementSource {
  id: string;
  label: string;
  dose: string;
}

interface Supplement {
  id: string;
  label: string;
  target: string;
  sources: SupplementSource[];
}

const supplements = supplementsData as Supplement[];

const COMMERCIAL_BALANCERS = [
  ['Balance IT', 'UC Davis veterinary nutritionists — recipe-specific'],
  ['Wysong Call of the Wild', 'For all-meat diets'],
  ['Animal Essentials Complete Multivitamin & Mineral', 'Broad spectrum'],
  ['Volhard NDF2', 'Full premix approach'],
];

export default function SupplementGuide() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">{t('supplements.title')}</h1>
      <p className="text-gray-400 text-sm mb-4">{t('supplements.subtitle')}</p>

      <div className="bg-amber-950/80 border border-amber-700/50 rounded-2xl p-4 mb-6 shadow-lg">
        <p className="text-sm text-amber-200"><strong>{t('supplements.caRatio')}</strong></p>
      </div>

      <div className="space-y-4 mb-6">
        {supplements.map(supp => (
          <div key={supp.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="font-bold text-lg text-amber-300">{supp.label}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                <span className="text-gray-300 font-medium">{t('common.target')}:</span> {supp.target}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {supp.sources.map(src => (
                <div key={src.id} className="bg-gray-800 rounded-xl p-3.5">
                  <p className="text-sm font-semibold text-gray-100">{src.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-gray-500 font-medium">{t('supplements.dose')}:</span> {src.dose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-bold text-amber-300 text-lg">{t('supplements.commercialBalancers')}</h2>
        </div>
        <div className="p-4 space-y-2">
          {COMMERCIAL_BALANCERS.map(([name, desc]) => (
            <div key={name} className="bg-gray-800 rounded-xl p-3.5 flex gap-3 items-start">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

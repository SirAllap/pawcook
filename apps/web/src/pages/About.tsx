import { useTranslation } from 'react-i18next';

const SOURCES = [
  'AAFCO Dog Food Nutrient Profiles',
  'NRC Nutrient Requirements of Dogs and Cats (2006)',
  'FEDIAF Nutritional Guidelines',
  'Merck Veterinary Manual',
  'WSAVA Global Nutrition Guidelines',
  'ACVN position statements',
];

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-amber-400 mb-1">{t('about.title')}</h1>
        <p className="text-gray-400 text-sm">{t('about.subtitle')}</p>
      </div>

      <div className="bg-red-950/80 border border-red-800/60 rounded-2xl p-5 space-y-3 shadow-lg">
        <h2 className="font-bold text-red-300 text-base">⚠️ {t('about.disclaimers')}</h2>
        <p className="text-sm text-red-200">{t('about.notVetAdvice')}</p>
        <p className="text-sm text-red-200"><strong>{t('about.noBones')}</strong></p>
        <p className="text-sm text-red-200"><strong>{t('about.pathogen')}</strong></p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3 shadow-lg">
        <h2 className="font-bold text-amber-300 text-base">{t('about.methodology')}</h2>
        <div className="space-y-2">
          {SOURCES.map(s => (
            <div key={s} className="flex gap-3 items-start">
              <span className="text-amber-500 shrink-0 mt-0.5">•</span>
              <p className="text-sm text-gray-300">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <h2 className="font-bold text-amber-300 text-base mb-2">{t('about.openSource')}</h2>
        <p className="text-sm text-gray-300">
          {t('about.openSourceText')}{' '}
          <a
            href="https://github.com/SirAllap/pawcook"
            className="text-amber-400 underline hover:text-amber-300 transition-colors"
          >
            {t('about.github')}
          </a>.
        </p>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';

const SOURCES = [
  { label: 'AAFCO Dog Food Nutrient Profiles',             icon: '📋', url: 'https://www.aafco.org/resources/aafco-methods-for-substantiating-nutritional-adequacy-of-dog-and-cat-foods/' },
  { label: 'NRC Nutrient Requirements of Dogs and Cats (2006)', icon: '🔬', url: 'https://www.nap.edu/catalog/10668/nutrient-requirements-of-dogs-and-cats' },
  { label: 'FEDIAF Nutritional Guidelines',                icon: '🇪🇺', url: 'https://www.fediaf.org/self-regulation/nutrition.html' },
  { label: 'Merck Veterinary Manual',                      icon: '📗', url: 'https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals' },
  { label: 'WSAVA Global Nutrition Guidelines',            icon: '🌍', url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/' },
  { label: 'ACVN position statements',                     icon: '🩺', url: 'https://www.acvn.org/position-statements/' },
];

const GITHUB_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{t('about.title')}</h1>
        <p className="text-gray-400 text-sm">{t('about.subtitle')}</p>
      </div>

      {/* Disclaimer */}
      <div className="glass-card rounded-3xl overflow-hidden border-l-[3px] border-red-500/60 animate-fade-in-up delay-100">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-black text-red-300 text-base">⚠️ {t('about.disclaimers')}</h2>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-red-200/90 leading-relaxed">{t('about.notVetAdvice')}</p>
          <div className="bg-red-950/40 border border-red-800/30 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-200 font-bold leading-relaxed">🦴 {t('about.noBones')}</p>
          </div>
          <div className="bg-red-950/40 border border-red-800/30 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-200 font-bold leading-relaxed">🌡️ {t('about.pathogen')}</p>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-200">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-black text-white text-base">📚 {t('about.methodology')}</h2>
        </div>
        <div className="p-4 space-y-2">
          {SOURCES.map(({ label, icon, url }, i) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 flex gap-3 items-center animate-slide-up
                         hover:bg-white/[0.07] hover:border-white/[0.12] transition-all active:scale-[0.98] group"
              style={{ animationDelay: `${200 + i * 50}ms` }}>
              <span className="text-xl shrink-0">{icon}</span>
              <p className="text-sm text-gray-300 font-medium flex-1">{label}</p>
              <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-400 transition-colors shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Open source */}
      <div className="glass-card rounded-3xl p-5 animate-fade-in-up delay-400">
        <h2 className="font-black text-white text-base mb-3">⭐ {t('about.openSource')}</h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          {t('about.openSourceText')}{' '}
          <a href="https://github.com/SirAllap/pawcook" target="_blank" rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-bold transition-colors underline">
            {t('about.github')}
          </a>.
        </p>
        <a href="https://github.com/SirAllap/pawcook" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 glass px-4 py-2.5 rounded-xl text-sm font-bold
                     text-gray-200 hover:text-white transition-all hover:bg-white/[0.08] active:scale-95">
          {GITHUB_SVG}
          GitHub
        </a>
      </div>
    </div>
  );
}

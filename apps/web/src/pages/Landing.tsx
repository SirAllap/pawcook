import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  {
    icon: '🍖',
    titleKey: 'nav.cooking',
    descKey: 'landing.features.cooking',
    to: '/cooking',
    accent: 'amber',
  },
  {
    icon: '🐕',
    titleKey: 'nav.nutrition',
    descKey: 'landing.features.nutrition',
    to: '/nutrition',
    accent: 'blue',
  },
  {
    icon: '⚠️',
    titleKey: 'nav.foodSafety',
    descKey: 'landing.features.foodSafety',
    to: '/food-safety',
    accent: 'red',
  },
  {
    icon: '💊',
    titleKey: 'nav.supplements',
    descKey: 'landing.features.supplements',
    to: '/supplements',
    accent: 'green',
  },
] as const;

const ACCENT_CLASSES = {
  amber: {
    card: 'border-amber-800/40 hover:border-amber-500/60',
    icon: 'bg-amber-500/10 text-amber-400',
    link: 'text-amber-400 group-hover:text-amber-300',
    glow: 'group-hover:shadow-amber-500/10',
  },
  blue: {
    card: 'border-blue-800/40 hover:border-blue-500/60',
    icon: 'bg-blue-500/10 text-blue-400',
    link: 'text-blue-400 group-hover:text-blue-300',
    glow: 'group-hover:shadow-blue-500/10',
  },
  red: {
    card: 'border-red-800/40 hover:border-red-500/60',
    icon: 'bg-red-500/10 text-red-400',
    link: 'text-red-400 group-hover:text-red-300',
    glow: 'group-hover:shadow-red-500/10',
  },
  green: {
    card: 'border-green-800/40 hover:border-green-500/60',
    icon: 'bg-green-500/10 text-green-400',
    link: 'text-green-400 group-hover:text-green-300',
    glow: 'group-hover:shadow-green-500/10',
  },
};

const SOURCES = ['AAFCO', 'NRC', 'FEDIAF', 'WSAVA', 'ACVN'];

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 pb-4">
      {/* Hero */}
      <section className="text-center pt-6 pb-4 space-y-5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-5xl shadow-xl shadow-amber-500/10 animate-scale-in">
          🐾
        </div>

        <div className="space-y-3 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span className="text-white">Paw</span>
            <span className="text-amber-400">Cook</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-gray-200 leading-snug">
            {t('landing.hero.tagline')}
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            {t('landing.hero.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
          <Link
            to="/cooking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-gray-900 font-bold px-7 py-3.5 rounded-2xl text-base transition-all shadow-xl shadow-amber-500/30"
          >
            🍖 {t('landing.hero.cta')}
          </Link>
          <Link
            to="/about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 active:scale-[0.97] text-gray-200 font-medium px-7 py-3.5 rounded-2xl text-base transition-all border border-gray-700"
          >
            {t('landing.hero.learnMore')}
          </Link>
        </div>

        {/* trust chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 animate-fade-in">
          {SOURCES.map(s => (
            <span key={s} className="text-xs text-gray-500 border border-gray-800 bg-gray-900/60 px-2.5 py-1 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">
          {t('landing.features.heading')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, titleKey, descKey, to, accent }) => {
            const cls = ACCENT_CLASSES[accent];
            return (
              <Link
                key={to}
                to={to}
                className={`group bg-gray-900 border ${cls.card} rounded-2xl p-5 transition-all hover:bg-gray-900/80 shadow-lg hover:shadow-xl ${cls.glow} active:scale-[0.98]`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cls.icon}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base mb-1">{t(titleKey)}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{t(descKey)}</p>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${cls.link} transition-colors`}>
                  {t('landing.openTool')}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Open source banner */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center space-y-2 shadow-lg">
        <div className="text-2xl">⭐</div>
        <h3 className="font-bold text-white text-base">{t('landing.open.title')}</h3>
        <p className="text-sm text-gray-400">{t('landing.open.text')}</p>
        <a
          href="https://github.com/SirAllap/pawcook"
          className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors mt-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </section>

      {/* Disclaimer */}
      <section className="text-center">
        <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
          ⚠️ {t('common.disclaimer')}
        </p>
      </section>
    </div>
  );
}

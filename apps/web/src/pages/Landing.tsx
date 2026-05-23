import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: '🍖', titleKey: 'nav.cooking',    descKey: 'landing.features.cooking',    to: '/cooking',     accent: 'amber' },
  { icon: '🐕', titleKey: 'nav.nutrition',  descKey: 'landing.features.nutrition',  to: '/nutrition',   accent: 'blue'  },
  { icon: '⚠️', titleKey: 'nav.foodSafety', descKey: 'landing.features.foodSafety', to: '/food-safety', accent: 'red'   },
  { icon: '💊', titleKey: 'nav.supplements',descKey: 'landing.features.supplements',to: '/supplements', accent: 'green' },
] as const;

const ACCENT: Record<string, { edge: string; icon: string; link: string }> = {
  amber: { edge: 'from-amber-400/80 to-amber-600/40', icon: 'bg-amber-500/10 text-amber-400', link: 'text-amber-400' },
  blue:  { edge: 'from-blue-400/80  to-blue-600/40',  icon: 'bg-blue-500/10  text-blue-400',  link: 'text-blue-400'  },
  red:   { edge: 'from-red-400/80   to-red-600/40',   icon: 'bg-red-500/10   text-red-400',   link: 'text-red-400'   },
  green: { edge: 'from-green-400/80 to-green-600/40', icon: 'bg-green-500/10 text-green-400', link: 'text-green-400' },
};

const SOURCES = ['AAFCO', 'NRC', 'FEDIAF', 'WSAVA', 'ACVN'];

const GITHUB_SVG = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="space-y-14 pb-4">

      {/* ── Hero ── */}
      <section className="relative text-center pt-8 pb-4">
        {/* Ambient orb */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none flex justify-center">
          <div className="w-[340px] h-[340px] rounded-full bg-amber-500/10 blur-3xl animate-orb mt-[-40px]" />
        </div>

        {/* Floating icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px]
                       bg-amber-500/10 border border-amber-500/20 text-6xl
                       shadow-2xl shadow-amber-500/15 animate-float mb-6 glow-amber">
          🐾
        </div>

        {/* Brand + tagline */}
        <div className="space-y-3 animate-fade-in-up delay-100">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none">
            <span className="text-gradient">Paw</span>
            <span className="text-white">Cook</span>
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-white/90 leading-snug">
            {t('landing.hero.tagline')}
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            {t('landing.hero.subtitle')}
          </p>
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7 animate-fade-in-up delay-200">
          <Link to="/cooking"
            className="inline-flex items-center justify-center gap-2
                      bg-amber-500 hover:bg-amber-400 active:scale-[0.97]
                      text-gray-900 font-black px-8 py-4 rounded-2xl text-base
                      transition-all glow-sm-amber shadow-2xl">
            🍖 {t('landing.hero.cta')}
          </Link>
          <Link to="/about"
            className="inline-flex items-center justify-center gap-2
                      glass text-gray-200 font-semibold px-8 py-4 rounded-2xl text-base
                      transition-all hover:bg-white/[0.08] active:scale-[0.97]">
            {t('landing.hero.learnMore')}
          </Link>
        </div>

        {/* Trust chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-in delay-400">
          {SOURCES.map(s => (
            <span key={s} className="text-[11px] font-semibold text-gray-500 glass px-3 py-1.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="space-y-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.14em] text-center">
          {t('landing.features.heading')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon, titleKey, descKey, to, accent }, i) => {
            const cls = ACCENT[accent];
            return (
              <Link key={to} to={to}
                className="group relative glass-card rounded-[20px] p-5 transition-all duration-300
                           hover:bg-white/[0.055] active:scale-[0.98] overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${200 + i * 75}ms` }}>
                {/* Colored left edge */}
                <div className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-gradient-to-b ${cls.edge}`} />

                <div className="flex items-start gap-4 pl-3">
                  <div className={`shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl ${cls.icon}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base mb-1 leading-snug">{t(titleKey)}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{t(descKey)}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-sm font-bold ${cls.link} pl-[67px] mt-3 transition-all`}>
                  {t('landing.openTool')}
                  <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Open source ── */}
      <section className="glass-card rounded-[20px] p-6 text-center space-y-3 animate-fade-in delay-500">
        <div className="text-3xl">⭐</div>
        <h3 className="font-black text-white text-lg">{t('landing.open.title')}</h3>
        <p className="text-sm text-gray-400">{t('landing.open.text')}</p>
        <a href="https://github.com/SirAllap/pawcook" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-semibold transition-colors">
          {GITHUB_SVG}
          GitHub
        </a>
      </section>

      <p className="text-xs text-gray-600 text-center leading-relaxed max-w-sm mx-auto pb-2">
        ⚠️ {t('common.disclaimer')}
      </p>
    </div>
  );
}

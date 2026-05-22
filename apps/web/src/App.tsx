import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import Landing from './pages/Landing';
import CookingCalculator from './pages/CookingCalculator';
import NutritionCalculator from './pages/NutritionCalculator';
import FoodSafety from './pages/FoodSafety';
import SupplementGuide from './pages/SupplementGuide';
import About from './pages/About';

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pl', label: 'Polski',     flag: '🇵🇱' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function selectLang(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  }

  return (
    <>
      {/* backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={ref} className="relative z-50">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-95 border border-gray-700"
          aria-label="Change language"
        >
          <GlobeIcon />
          <span className="text-sm hidden sm:block font-medium">{currentLang.flag} {currentLang.label}</span>
          <span className="text-sm sm:hidden">{currentLang.flag}</span>
        </button>

        {open && (
          <>
            {/* Desktop dropdown */}
            <div className="hidden lg:block absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => selectLang(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-800 active:bg-gray-700 ${
                    lang.code === currentLang.code ? 'text-amber-400' : 'text-gray-200'
                  }`}>
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1 text-left font-medium">{lang.label}</span>
                  {lang.code === currentLang.code && <span className="text-amber-400 text-base">✓</span>}
                </button>
              ))}
            </div>

            {/* Mobile bottom sheet */}
            <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl border-t border-gray-700 shadow-2xl animate-fade-in-up"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mt-3 mb-4" />
              <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => selectLang(lang.code)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all active:scale-95 font-medium ${
                      lang.code === currentLang.code
                        ? 'bg-amber-500 text-gray-900'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    }`}>
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs = [
    { to: '/cooking',     label: t('nav.cooking'),     icon: '🍖' },
    { to: '/nutrition',   label: t('nav.nutrition'),   icon: '🐕' },
    { to: '/food-safety', label: t('nav.foodSafety'),  icon: '⚠️' },
    { to: '/supplements', label: t('nav.supplements'), icon: '💊' },
    { to: '/about',       label: t('nav.about'),       icon: 'ℹ️' },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(({ to, label, icon }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-1 pb-2 relative transition-all active:scale-95 ${
                isActive ? 'text-amber-400' : 'text-gray-500'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <span className="text-xl leading-tight">{icon}</span>
              <span className="text-[11px] leading-tight font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/cooking',     label: t('nav.cooking') },
    { to: '/nutrition',   label: t('nav.nutrition') },
    { to: '/food-safety', label: t('nav.foodSafety') },
    { to: '/supplements', label: t('nav.supplements') },
    { to: '/about',       label: t('nav.about') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800/80 sticky top-0 z-30 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🐾</span>
            <div>
              <span className="text-lg font-bold text-amber-400 leading-none block">PawCook</span>
              <span className="text-[10px] text-gray-500 leading-none hidden sm:block">Dog Food Calculator</span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex gap-1 text-sm flex-1 justify-center">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg transition-all font-medium ${
                    isActive ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 pb-28 lg:pb-8">
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/cooking"     element={<CookingCalculator />} />
          <Route path="/nutrition"   element={<NutritionCalculator />} />
          <Route path="/food-safety" element={<FoodSafety />} />
          <Route path="/supplements" element={<SupplementGuide />} />
          <Route path="/about"       element={<About />} />
        </Routes>
      </main>

      <footer className="hidden lg:block bg-gray-900/80 border-t border-gray-800 text-center text-xs text-gray-600 py-4 no-print">
        ⚠️ {t('common.disclaimer')}
        &nbsp;·&nbsp;
        <a href="https://github.com/SirAllap/pawcook" className="text-gray-500 underline hover:text-gray-300 transition-colors">
          {t('common.openSource')}
        </a>
        &nbsp;·&nbsp; MIT
      </footer>

      <BottomNav />
    </div>
  );
}

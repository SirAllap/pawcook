import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
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
      className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  function selectLang(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  }

  // Portal escapes the header's sticky stacking context (z-30)
  const overlays = open ? createPortal(
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
        onClick={() => setOpen(false)}
      />
      {/* Mobile bottom sheet */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-[60] bg-[#0e0e18] rounded-t-[28px] border-t border-white/[0.08] shadow-2xl animate-fade-in-up"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-5" />
        <div className="px-4 pb-2 grid grid-cols-2 gap-2">
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => selectLang(lang.code)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all active:scale-95 font-semibold ${
                lang.code === currentLang.code
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-white/[0.05] border border-white/[0.08] text-gray-200 hover:bg-white/[0.09]'
              }`}>
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Desktop dropdown */}
      <div
        className="hidden lg:block fixed z-50 w-52 bg-[#0e0e18] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        style={(() => {
          const r = btnRef.current?.getBoundingClientRect();
          return r ? { top: r.bottom + 8, right: window.innerWidth - r.right } : {};
        })()}
      >
        {LANGUAGES.map(lang => (
          <button key={lang.code} onClick={() => selectLang(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/[0.06] active:bg-white/[0.03] ${
              lang.code === currentLang.code ? 'text-amber-400' : 'text-gray-200'
            }`}>
            <span className="text-xl">{lang.flag}</span>
            <span className="flex-1 text-left font-medium">{lang.label}</span>
            {lang.code === currentLang.code && <span className="text-amber-400">✓</span>}
          </button>
        ))}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {overlays}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-gray-300 hover:text-white transition-all active:scale-95"
        aria-label="Change language"
        aria-expanded={open}
      >
        <GlobeIcon />
        <span className="text-sm hidden sm:block font-semibold">{currentLang.flag} {currentLang.label}</span>
        <span className="text-sm sm:hidden">{currentLang.flag}</span>
      </button>
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
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 no-print px-3"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="bg-[#0d0d16]/95 backdrop-blur-2xl border border-white/[0.09] rounded-[26px] shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex h-[60px]">
          {tabs.map(({ to, label, icon }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-amber-400' : 'text-gray-500'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[2.5px] bg-amber-400 rounded-full shadow-sm shadow-amber-400/80" />
                )}
                <span className={`text-[21px] leading-none transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {icon}
                </span>
                <span className="text-[10px] font-semibold leading-none w-full text-center truncate px-0.5 mt-0.5">
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
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
      <header className="bg-[#07070f]/85 backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-30 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-2xl animate-float" style={{ animationDuration: '5s' }}>🐾</span>
            <div>
              <span className="text-[17px] font-black leading-none block tracking-tight">
                <span className="text-gradient">Paw</span>
                <span className="text-white">Cook</span>
              </span>
              <span className="text-[10px] text-gray-500 leading-none hidden sm:block font-medium mt-0.5">{t('common.dogFoodCalc')}</span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex gap-0.5 text-sm flex-1 justify-center">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-xl transition-all font-semibold ${
                    isActive
                      ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 pb-32 lg:pb-8">
        <Routes>
          <Route path="/"            element={<Landing />} />
          <Route path="/cooking"     element={<CookingCalculator />} />
          <Route path="/nutrition"   element={<NutritionCalculator />} />
          <Route path="/food-safety" element={<FoodSafety />} />
          <Route path="/supplements" element={<SupplementGuide />} />
          <Route path="/about"       element={<About />} />
        </Routes>
      </main>

      <footer className="hidden lg:block border-t border-white/[0.05] text-center text-xs text-gray-600 py-4 no-print">
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

import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import CookingCalculator from './pages/CookingCalculator';
import NutritionCalculator from './pages/NutritionCalculator';
import FoodSafety from './pages/FoodSafety';
import SupplementGuide from './pages/SupplementGuide';
import About from './pages/About';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectLang(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-95"
        aria-label="Change language"
      >
        <GlobeIcon />
        <span className="text-sm hidden sm:block">{currentLang.flag} {currentLang.label}</span>
        <span className="text-sm sm:hidden">{currentLang.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => selectLang(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-700 active:bg-gray-600 ${
                lang.code === i18n.language ? 'text-amber-400 bg-gray-750' : 'text-gray-200'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === i18n.language && <span className="ml-auto text-amber-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const tabs = [
    { to: '/', label: t('nav.cooking'), icon: '🍖' },
    { to: '/nutrition', label: t('nav.nutrition'), icon: '🐕' },
    { to: '/food-safety', label: t('nav.foodSafety'), icon: '⚠️' },
    { to: '/supplements', label: t('nav.supplements'), icon: '💊' },
    { to: '/about', label: t('nav.about'), icon: 'ℹ️' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {tabs.map(({ to, label, icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs transition-all active:scale-95 ${
                isActive ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-lg leading-tight">{icon}</span>
              <span className="leading-tight truncate w-full text-center" style={{ fontSize: '10px' }}>{label}</span>
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
    { to: '/', label: t('nav.cooking') },
    { to: '/nutrition', label: t('nav.nutrition') },
    { to: '/food-safety', label: t('nav.foodSafety') },
    { to: '/supplements', label: t('nav.supplements') },
    { to: '/about', label: t('nav.about') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 to-gray-900">
      <header className="bg-gray-900/95 backdrop-blur border-b border-gray-800 sticky top-0 z-30 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <a href="/" className="text-xl font-bold text-amber-400 shrink-0">🐾 PawCook</a>

          <nav className="hidden lg:flex gap-1 text-sm">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md transition-all ${
                    isActive
                      ? 'bg-amber-500 text-gray-900 font-medium'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 lg:pb-6">
        <Routes>
          <Route path="/" element={<CookingCalculator />} />
          <Route path="/nutrition" element={<NutritionCalculator />} />
          <Route path="/food-safety" element={<FoodSafety />} />
          <Route path="/supplements" element={<SupplementGuide />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="hidden lg:block bg-gray-900 border-t border-gray-800 text-center text-xs text-gray-500 py-3 no-print">
        ⚠️ {t('common.disclaimer')}
        &nbsp;·&nbsp;
        <a href="https://github.com/SirAllap/pawcook" className="underline hover:text-gray-300">{t('common.openSource')}</a>
        &nbsp;·&nbsp; MIT
      </footer>

      <BottomNav />
    </div>
  );
}

import { Routes, Route, NavLink } from 'react-router-dom';
import CookingCalculator from './pages/CookingCalculator';
import NutritionCalculator from './pages/NutritionCalculator';
import FoodSafety from './pages/FoodSafety';
import SupplementGuide from './pages/SupplementGuide';
import About from './pages/About';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-amber-400">🐾 PawCook</a>
          <nav className="flex gap-1 text-sm flex-wrap">
            {[
              { to: '/', label: 'Cooking' },
              { to: '/nutrition', label: 'Nutrition' },
              { to: '/food-safety', label: 'Food Safety' },
              { to: '/supplements', label: 'Supplements' },
              { to: '/about', label: 'About' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? 'bg-amber-500 text-gray-900 font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<CookingCalculator />} />
          <Route path="/nutrition" element={<NutritionCalculator />} />
          <Route path="/food-safety" element={<FoodSafety />} />
          <Route path="/supplements" element={<SupplementGuide />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 text-center text-xs text-gray-500 py-3 no-print">
        ⚠️ Not veterinary advice. Consult a board-certified veterinary nutritionist (ACVN) for long-term homemade feeding.
        &nbsp;·&nbsp;
        <a href="https://github.com/SirAllap/pawcook" className="underline hover:text-gray-300">Open source</a>
        &nbsp;·&nbsp; MIT License
      </footer>
    </div>
  );
}

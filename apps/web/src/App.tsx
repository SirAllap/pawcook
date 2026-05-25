import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './components/layout/app-shell';
import { PageTransition } from './components/motion/page-transition';
import { PageFallback } from './components/ui/page-fallback';

const Landing             = lazy(() => import('./pages/Landing'));
const CookingCalculator   = lazy(() => import('./pages/CookingCalculator'));
const NutritionCalculator = lazy(() => import('./pages/NutritionCalculator'));
const FoodSafety          = lazy(() => import('./pages/FoodSafety'));
const SupplementGuide     = lazy(() => import('./pages/SupplementGuide'));
const About               = lazy(() => import('./pages/About'));
const PetsList            = lazy(() => import('./pages/Pets/PetsList'));
const PetNew              = lazy(() => import('./pages/Pets/PetNew'));
const PetDetail           = lazy(() => import('./pages/Pets/PetDetail'));
const PetEdit             = lazy(() => import('./pages/Pets/PetEdit'));
const PlanLanding         = lazy(() => import('./pages/MealPlan/PlanLanding'));
const PlanWizard          = lazy(() => import('./pages/MealPlan/PlanWizard'));
const PlanView            = lazy(() => import('./pages/MealPlan/PlanView'));
const NotFound            = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <AppShell>
      <PageTransition>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"            element={<Landing />} />
            <Route path="/cooking"     element={<CookingCalculator />} />
            <Route path="/nutrition"   element={<NutritionCalculator />} />
            <Route path="/food-safety" element={<FoodSafety />} />
            <Route path="/supplements" element={<SupplementGuide />} />
            <Route path="/pets"          element={<PetsList />} />
            <Route path="/pets/new"      element={<PetNew />} />
            <Route path="/pets/:id"      element={<PetDetail />} />
            <Route path="/pets/:id/edit" element={<PetEdit />} />
            <Route path="/meal-plan"          element={<PlanLanding />} />
            <Route path="/meal-plan/new"      element={<PlanWizard />} />
            <Route path="/meal-plan/:id"      element={<PlanView />} />
            <Route path="/meal-plan/:id/edit" element={<PlanWizard />} />
            <Route path="/about"       element={<About />} />
            <Route path="*"            element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </AppShell>
  );
}

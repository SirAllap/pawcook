import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MotionConfig } from 'motion/react';
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
const StarterPicker       = lazy(() => import('./pages/MealPlan/StarterPicker'));
const PlanView            = lazy(() => import('./pages/MealPlan/PlanView'));
const NotFound            = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    // reducedMotion="user" makes every Motion animation (page transitions,
    // FadeIn, Stagger, NumberFlow) honour the OS "reduce motion" setting —
    // Motion does not do this automatically for JS-driven variants.
    <MotionConfig reducedMotion="user">
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
            <Route path="/meal-plan/start"    element={<StarterPicker />} />
            <Route path="/meal-plan/new"      element={<PlanWizard />} />
            <Route path="/meal-plan/:id"      element={<PlanView />} />
            <Route path="/meal-plan/:id/edit" element={<PlanWizard />} />
            <Route path="/about"       element={<About />} />
              <Route path="*"            element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AppShell>
    </MotionConfig>
  );
}

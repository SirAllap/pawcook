import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './styles/globals.css';
import { ThemeProvider } from './lib/theme';
import { SpeciesProvider } from './lib/species';
import { PetProfilesProvider } from './contexts/PetProfilesContext';
import { MealPlansProvider } from './contexts/MealPlansContext';
import { ShoppingChecksProvider } from './contexts/ShoppingChecksContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SpeciesProvider>
        <OnboardingProvider>
          <PetProfilesProvider>
            <MealPlansProvider>
              <ShoppingChecksProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                  <App />
                </BrowserRouter>
              </ShoppingChecksProvider>
            </MealPlansProvider>
          </PetProfilesProvider>
        </OnboardingProvider>
      </SpeciesProvider>
    </ThemeProvider>
  </StrictMode>
);

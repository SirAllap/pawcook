import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './styles/globals.css';
import { ThemeProvider } from './lib/theme';
import { SpeciesProvider } from './lib/species';
import { PetProfilesProvider } from './contexts/PetProfilesContext';
import { MealPlansProvider } from './contexts/MealPlansContext';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SpeciesProvider>
        <PetProfilesProvider>
          <MealPlansProvider>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <App />
            </BrowserRouter>
          </MealPlansProvider>
        </PetProfilesProvider>
      </SpeciesProvider>
    </ThemeProvider>
  </StrictMode>
);

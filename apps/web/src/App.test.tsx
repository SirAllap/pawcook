import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { SpeciesProvider } from './lib/species';
import { PetProfilesProvider } from './contexts/PetProfilesContext';
import App from './App';

function setup() {
  // Pre-set the species so the picker sheet doesn't intercept on mount.
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('pawcook_species', 'dog');
  }
  return render(
    <ThemeProvider>
      <SpeciesProvider>
        <PetProfilesProvider>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </PetProfilesProvider>
      </SpeciesProvider>
    </ThemeProvider>
  );
}

describe('App', () => {
  it('renders the PawCook wordmark', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getAllByText('Paw').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Cook').length).toBeGreaterThan(0);
    });
  });

  it('renders the navigation links', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getAllByText('Pets').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Cooking').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nutrition').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Food Safety').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Supplements').length).toBeGreaterThan(0);
      expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { SpeciesProvider } from './lib/species';
import { PetProfilesProvider } from './contexts/PetProfilesContext';
import App from './App';

function setup(initialPath: string = '/') {
  // Pre-set the species so the picker sheet doesn't intercept on mount.
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('pawcook_species', 'dog');
  }
  return render(
    <ThemeProvider>
      <SpeciesProvider>
        <PetProfilesProvider>
          <MemoryRouter initialEntries={[initialPath]}>
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

  it('renders the primary navigation on an in-app route', async () => {
    // Landing intentionally hides the bottom nav (the bento grid is the
    // navigation there); pick a regular page so we exercise the nav.
    // The mobile bar carries the four daily tools plus a "More" entry;
    // Food Safety / Supplements / About live one tap away under More.
    setup('/about');
    await waitFor(() => {
      expect(screen.getAllByText('Pets').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Plan').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Calculator').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nutrition').length).toBeGreaterThan(0);
      expect(screen.getAllByText('More').length).toBeGreaterThan(0);
    });
  });
});

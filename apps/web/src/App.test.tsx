import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders the PawCook header', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/PawCook/i)).toBeInTheDocument();
  });

  it('renders the navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // Nav labels appear in both desktop nav and mobile bottom nav
    expect(screen.getAllByText('Cooking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nutrition').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Food Safety').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Supplements').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
  });
});

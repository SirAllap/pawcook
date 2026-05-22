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
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
    expect(screen.getByText('Food Safety')).toBeInTheDocument();
    expect(screen.getByText('Supplements')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});

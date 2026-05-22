import { describe, it, expect } from 'vitest';
import { calculateCookingTime } from './cooking.js';
import type { CookingInput } from './schemas.js';

const davidScenario: CookingInput = {
  meatType: 'beef',
  form: 'minced',
  weightKg: 1,
  numberOfBags: 6,
  thicknessCm: 5,
  cookingMethod: 'sous_vide',
  fatContent: 'medium',
  temperatureUnit: 'celsius',
};

describe('calculateCookingTime', () => {
  it('David scenario: 6×1kg minced beef 5cm sous-vide should be ~60 min', () => {
    const result = calculateCookingTime(davidScenario);
    expect(result.cookingTimeMinutes.min).toBeGreaterThanOrEqual(55);
    expect(result.cookingTimeMinutes.max).toBeLessThanOrEqual(90);
  });

  it('safe internal temp is always 74°C / 165°F', () => {
    const result = calculateCookingTime(davidScenario);
    expect(result.safeInternalTempC).toBe(74);
    expect(result.safeInternalTempF).toBe(165);
  });

  it('includes cooked bones warning', () => {
    const result = calculateCookingTime(davidScenario);
    expect(result.warnings.some(w => w.includes('cooked bones'))).toBe(true);
  });

  it('pork includes Trichinella warning', () => {
    const result = calculateCookingTime({ ...davidScenario, meatType: 'pork' });
    expect(result.warnings.some(w => w.includes('Trichinella'))).toBe(true);
  });

  it('slow cooker is longer than sous-vide', () => {
    const sous = calculateCookingTime(davidScenario);
    const slow = calculateCookingTime({ ...davidScenario, cookingMethod: 'slow_cooker' });
    expect(slow.cookingTimeMinutes.min).toBeGreaterThan(sous.cookingTimeMinutes.min);
  });
});

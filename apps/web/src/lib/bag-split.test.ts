import { describe, it, expect } from 'vitest';
import { computeBagSplit, MAX_BAGS } from './bag-split';

describe('computeBagSplit', () => {
  // The owner's reported scenario: 2 dogs + 1 cat eat ~0.69 kg/day of
  // salmon between them. A 2-day bag must hold ~1.39 kg whether the plan
  // is 7 or 14 days long — only the NUMBER of bags should change.
  const DAILY_KG = 0.69;

  it('keeps the full-bag size identical regardless of plan length (the reported bug)', () => {
    const sevenDay = computeBagSplit(DAILY_KG * 7, 7, 2);
    const fourteenDay = computeBagSplit(DAILY_KG * 14, 14, 2);
    expect(sevenDay.fullBagKg).toBeCloseTo(1.38, 2);
    expect(fourteenDay.fullBagKg).toBeCloseTo(1.38, 2);
    // Same-sized full bags, just more of them on the longer plan.
    expect(fourteenDay.fullBagKg).toBe(sevenDay.fullBagKg);
    expect(fourteenDay.fullBagCount).toBeGreaterThan(sevenDay.fullBagCount);
  });

  it('represents an odd plan length as full bags + one honest smaller bag', () => {
    // 7 days at 2-day bags = three 2-day bags + one 1-day bag, NOT four
    // equal diluted bags.
    const split = computeBagSplit(DAILY_KG * 7, 7, 2);
    expect(split.fullBagCount).toBe(3);
    expect(split.remainderDays).toBe(1);
    expect(split.bagCount).toBe(4);
    expect(split.remainderBagKg).toBeCloseTo(0.69, 2);
    expect(split.remainderBagKg).toBeLessThan(split.fullBagKg);
  });

  it('has no remainder bag when the plan divides evenly', () => {
    const split = computeBagSplit(DAILY_KG * 14, 14, 2);
    expect(split.fullBagCount).toBe(7);
    expect(split.remainderDays).toBe(0);
    expect(split.remainderBagKg).toBe(0);
    expect(split.bagCount).toBe(7);
  });

  it('bag weights always sum back to the real total (no phantom grams)', () => {
    for (const [total, days, perBag] of [
      [DAILY_KG * 7, 7, 2],
      [DAILY_KG * 14, 14, 3],
      [DAILY_KG * 30, 30, 3],
      [5, 9, 2],
      [2.2, 5, 1],
    ] as const) {
      const s = computeBagSplit(total, days, perBag);
      expect(s.totalKg).toBeCloseTo(Math.round(total * 100) / 100, 1);
    }
  });

  it('1 day per bag means one bag per day, each a single daily portion', () => {
    const split = computeBagSplit(DAILY_KG * 5, 5, 1);
    expect(split.fullBagCount).toBe(5);
    expect(split.remainderDays).toBe(0);
    expect(split.fullBagKg).toBeCloseTo(0.69, 2);
  });

  it('clamps daysPerBag to the plan length', () => {
    const split = computeBagSplit(DAILY_KG * 3, 3, 7);
    expect(split.bagCount).toBe(1);
    expect(split.fullBagCount).toBe(1);
    expect(split.remainderDays).toBe(0);
  });

  it('never exceeds the bag cap', () => {
    const split = computeBagSplit(50, 40, 1);
    expect(split.bagCount).toBeLessThanOrEqual(MAX_BAGS);
  });
});

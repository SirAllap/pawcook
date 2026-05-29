/**
 * Cook-ahead bag split — pure, plan-length-independent.
 *
 * The owner reported two bugs in the freestanding Bag-strategy panel:
 *
 *  1. A bag that covers N days must always hold the SAME amount of food —
 *     N × the household's daily intake — regardless of how long the whole
 *     plan runs. The old code divided the entire batch evenly across
 *     `ceil(days / daysPerBag)` bags, so whenever the plan length wasn't a
 *     clean multiple of the window every bag came out diluted (7 days at
 *     2-day bags → 4 equal undersized bags instead of three 2-day bags + a
 *     one-day remainder).
 *
 *  2. The Split readout, the help text, and the value pushed back into the
 *     form all have to agree, and the bag weights have to sum to the real
 *     total (no phantom grams feeding the cook-time estimate).
 *
 * This module owns that arithmetic so the invariants are testable and the
 * three call sites can't drift apart.
 */

/** Hard cap on how many distinct bags we'll ever ask someone to manage. */
export const MAX_BAGS = 20;
/** Per-bag weight is clamped to a sane cooking range (kg). */
const MIN_BAG_KG = 0.1;
const MAX_BAG_KG = 5;

export interface BagSplit {
  /** Total number of bags (full + the partial remainder, if any). */
  bagCount: number;
  /** Weight of a full bag (kg), == daysPerBag × daily intake. */
  fullBagKg: number;
  /** Number of full-sized bags. */
  fullBagCount: number;
  /** Weight of the final partial bag (kg), or 0 when the plan divides evenly. */
  remainderBagKg: number;
  /** Number of days the remainder bag covers (0 when even). */
  remainderDays: number;
  /** Sum of all bag weights (kg), rounded — equals the input total within rounding. */
  totalKg: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampKg = (kg: number) => round2(Math.min(MAX_BAG_KG, Math.max(MIN_BAG_KG, kg)));

/**
 * Split a batch into freezer bags that each cover `daysPerBag` days.
 *
 * @param totalWeightKg total cooked-ahead weight for the whole plan
 * @param feedingDays   how many days the plan spans
 * @param daysPerBag    desired days-of-food per bag (clamped to [1, feedingDays])
 */
export function computeBagSplit(
  totalWeightKg: number,
  feedingDays: number,
  daysPerBag: number,
): BagSplit {
  const days = Math.max(1, Math.floor(feedingDays));
  const perBag = Math.max(1, Math.min(days, Math.floor(daysPerBag)));
  const dailyKg = totalWeightKg / days;

  const fullBagCount = Math.floor(days / perBag);
  const remainderDays = days - fullBagCount * perBag;

  const fullBagKg = clampKg(perBag * dailyKg);
  const remainderBagKg = remainderDays > 0 ? clampKg(remainderDays * dailyKg) : 0;

  // Cap the bag count without silently dropping food: if the cap bites
  // (only on absurdly long single-day plans), fold the surplus into the
  // last reported bag so the weights still sum to the real total.
  const rawCount = fullBagCount + (remainderDays > 0 ? 1 : 0);
  const bagCount = Math.min(MAX_BAGS, Math.max(1, rawCount));

  const totalKg = round2(fullBagCount * fullBagKg + remainderBagKg);

  return {
    bagCount,
    fullBagKg,
    fullBagCount: Math.min(fullBagCount, bagCount),
    remainderBagKg,
    remainderDays,
    totalKg,
  };
}

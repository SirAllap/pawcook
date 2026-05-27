import type { CookingPlan, MealPlan } from './schemas.js';
import { getIngredient } from './catalog.js';

/**
 * Emit an iCalendar (RFC 5545) document with two all-day events per bag:
 *   1. "Move to fridge" on the evening before the first usage day —
 *      cooked sous-vide blocks need 12–24 h fridge thaw, so the action
 *      lives the evening before, not the morning of.
 *   2. "Ready to serve" on the first usage day itself.
 * Importable into Apple, Google, Outlook calendars — no extra
 * notification infra required.
 */
export function buildThawCalendar(plan: MealPlan): string {
  const cooking: CookingPlan | undefined = plan.cookingPlan;
  if (!cooking || cooking.batches.length === 0) return emptyCalendar(plan);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pawcook//Thaw schedule//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${ical(plan.name)} - thaw schedule`,
  ];

  for (const batch of cooking.batches) {
    const ing = getIngredient(batch.ingredientId);
    const label = ing?.label ?? batch.ingredientId;
    const bagTag =
      batch.totalInSequence > 1
        ? `bag ${batch.sequence} of ${batch.totalInSequence}`
        : 'single bag';
    const firstServe = batch.dates[0]!;
    const moveToFridge = isoOffset(firstServe, -1);
    const description = [
      `${label}, ${batch.totalGrams} g`,
      `For: ${batch.forPetIds.join(', ')}`,
      `Serves on: ${batch.dates.join(', ')}`,
      `Use by: ${batch.useByDate}`,
    ].join('\\n');

    // Event 1 — move-to-fridge (evening before).
    lines.push(
      'BEGIN:VEVENT',
      `UID:${batch.id}-move@pawcook`,
      `DTSTAMP:${compactDateTime(plan.updatedAt)}`,
      `DTSTART;VALUE=DATE:${compactDate(moveToFridge)}`,
      `DTEND;VALUE=DATE:${compactDate(isoOffset(moveToFridge, 1))}`,
      `SUMMARY:${ical(`Move ${label} to fridge - ${bagTag}`)}`,
      `DESCRIPTION:${ical(description)}`,
      'END:VEVENT',
    );

    // Event 2 — ready to serve (first usage day).
    lines.push(
      'BEGIN:VEVENT',
      `UID:${batch.id}-ready@pawcook`,
      `DTSTAMP:${compactDateTime(plan.updatedAt)}`,
      `DTSTART;VALUE=DATE:${compactDate(firstServe)}`,
      `DTEND;VALUE=DATE:${compactDate(isoOffset(firstServe, 1))}`,
      `SUMMARY:${ical(`Ready: ${label} - ${bagTag}`)}`,
      `DESCRIPTION:${ical(description)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function emptyCalendar(plan: MealPlan): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pawcook//Thaw schedule//EN',
    `X-WR-CALNAME:${ical(plan.name)} - thaw schedule`,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

// RFC 5545 text escaping. Backslashes, commas, semicolons, newlines.
function ical(s: string): string {
  return s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, '');
}

function compactDateTime(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
}

function isoOffset(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

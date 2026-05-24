import type { CookingPlan, MealPlan } from './schemas.js';
import { getIngredient } from './catalog.js';

/**
 * Emit an iCalendar (RFC 5545) document with one all-day event per bag's
 * thaw date: "Thaw {ingredient} bag X of Y". Importable into Apple,
 * Google, Outlook calendars — no extra notification infra required.
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
    const summary = `Thaw ${label} - bag ${batch.sequence} of ${batch.totalInSequence}`;
    const description = [
      `${label}, ${batch.totalGrams} g`,
      `For: ${batch.forPetIds.join(', ')}`,
      `Serves on: ${batch.dates.join(', ')}`,
      `Use by: ${batch.useByDate}`,
    ].join('\\n');
    const dtStart = compactDate(batch.thawDate);
    const dtEnd = compactDate(isoOffset(batch.thawDate, 1));
    lines.push(
      'BEGIN:VEVENT',
      `UID:${batch.id}@pawcook`,
      `DTSTAMP:${compactDateTime(plan.updatedAt)}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ical(summary)}`,
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

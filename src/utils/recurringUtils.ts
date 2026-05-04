import type { RecurringPattern } from '@/types';

/**
 * Returns the YYYY-MM-DD string for the next occurrence after a given due date.
 * If dueDate is undefined, advances from today.
 */
export function getNextOccurrence(
  dueDate: string | undefined,
  pattern: RecurringPattern,
): string {
  const base = dueDate
    ? new Date(dueDate + 'T00:00:00')
    : new Date();

  switch (pattern) {
    case 'daily':
      base.setDate(base.getDate() + 1);
      break;

    case 'weekdays':
      // Advance 1 day, then skip over any weekend days
      base.setDate(base.getDate() + 1);
      if (base.getDay() === 6) base.setDate(base.getDate() + 2); // Sat → Mon
      if (base.getDay() === 0) base.setDate(base.getDate() + 1); // Sun → Mon
      break;

    case 'weekly':
      base.setDate(base.getDate() + 7);
      break;

    case 'monthly':
      base.setMonth(base.getMonth() + 1);
      break;

    default:
      break;
  }

  return base.toISOString().slice(0, 10);
}

/** Human-readable "next occurrence" label relative to today */
export function nextOccurrenceLabel(nextDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  if (nextDate === today)    return 'today';
  if (nextDate === tomorrow) return 'tomorrow';

  return new Date(nextDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

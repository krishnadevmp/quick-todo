/** Format a YYYY-MM-DD string to a human-readable label */
export function formatDueDate(dateStr: string | undefined): string {
  if (!dateStr) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateStr + 'T00:00:00');

  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0)  return 'Today';
  if (diffDays === 1)  return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < -1)  return `${Math.abs(diffDays)}d overdue`;
  if (diffDays < 7)   return date.toLocaleDateString('en-US', { weekday: 'short' });

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns true if the date string is in the past (overdue) */
export function isOverdue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
}

/** Returns today as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

import type { ParsedInput, Priority, Category, RecurringPattern } from '@/types';

// ── Inline shortcut regex patterns ────────────────────────────────────────
// #tag           → tag (can be repeated)
// !high / !h     → priority
// !medium / !m
// !low / !l
// due:today / due:tomorrow / due:YYYY-MM-DD / due:mon…sun
// every:day / every:daily / every:weekdays / every:week / every:month
// @work / @personal / @project / @routine  → category

const TAG_RE       = /#(\w+)/g;
const PRIORITY_RE  = /!(\w+)/g;
const DUE_RE       = /\bdue:(\S+)/i;
const RECURRING_RE = /\bevery:(\S+)/i;
const CATEGORY_RE  = /@(\w+)/g;

// ── Date helpers ──────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function parseDue(raw: string): string | undefined {
  const v = raw.toLowerCase();

  if (v === 'today')    return todayStr();
  if (v === 'tomorrow') return offsetDays(1);

  // Named weekdays: mon, tue, wed, thu, fri, sat, sun
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const idx = days.indexOf(v.slice(0, 3));
  if (idx !== -1) {
    const today = new Date().getDay();
    let diff = idx - today;
    if (diff <= 0) diff += 7; // always upcoming
    return offsetDays(diff);
  }

  // ISO date: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  return undefined;
}

function parsePriority(raw: string): Priority | undefined {
  const v = raw.toLowerCase();
  if (v === 'high'   || v === 'h') return 'high';
  if (v === 'medium' || v === 'm') return 'medium';
  if (v === 'low'    || v === 'l') return 'low';
  return undefined;
}

function parseCategory(raw: string): Category | undefined {
  const v = raw.toLowerCase();
  if (v === 'work')     return 'work';
  if (v === 'personal') return 'personal';
  if (v === 'project')  return 'project';
  if (v === 'routine')  return 'routine';
  return undefined;
}

function parseRecurring(raw: string): RecurringPattern | undefined {
  const v = raw.toLowerCase();
  if (v === 'day'   || v === 'daily')    return 'daily';
  if (v === 'weekdays')                  return 'weekdays';
  if (v === 'week'  || v === 'weekly')   return 'weekly';
  if (v === 'month' || v === 'monthly')  return 'monthly';
  return undefined;
}

// ── Main parser ───────────────────────────────────────────────────────────

/**
 * Parse a raw quick-add input string and extract all shortcut tokens.
 *
 * @example
 * parseInput('Buy milk due:tomorrow !high #groceries @personal every:week')
 * // → { title: 'Buy milk', dueDate: '2025-01-03', priority: 'high',
 * //     tags: ['groceries'], category: 'personal', recurring: 'weekly' }
 */
export function parseInput(raw: string): ParsedInput {
  let text = raw;

  // Collect tags
  const tags: string[] = [];
  text = text.replace(TAG_RE, (_, tag) => { tags.push(tag.toLowerCase()); return ''; });

  // Priority (last !token wins)
  let priority: Priority | undefined;
  text = text.replace(PRIORITY_RE, (_, p) => {
    const parsed = parsePriority(p);
    if (parsed) priority = parsed;
    return '';
  });

  // Category (last @token wins)
  let category: Category | undefined;
  text = text.replace(CATEGORY_RE, (_, c) => {
    const parsed = parseCategory(c);
    if (parsed) category = parsed;
    return '';
  });

  // Due date
  let dueDate: string | undefined;
  const dueMatch = DUE_RE.exec(text);
  if (dueMatch) {
    dueDate = parseDue(dueMatch[1]);
    text = text.replace(DUE_RE, '');
  }

  // Recurring
  let recurring: RecurringPattern | undefined;
  const recurMatch = RECURRING_RE.exec(text);
  if (recurMatch) {
    recurring = parseRecurring(recurMatch[1]);
    text = text.replace(RECURRING_RE, '');
  }

  // Clean up extra whitespace
  const title = text.replace(/\s+/g, ' ').trim();

  return { title, priority, category, dueDate, recurring, tags };
}

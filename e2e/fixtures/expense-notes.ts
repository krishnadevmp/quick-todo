// ── Raw notepad expense data ─────────────────────────────────────────────
// Paste your notepad text into RAW_EXPENSE_NOTES verbatim. Expected shape:
//
//   DD/MM/YYYY
//   1. Title: amount
//   2. Title: amount + amount + amount   (summed automatically)
//
//   DD/MM/YYYY
//   1. Title: amount
//
// One blank line between date blocks. Numbering doesn't need to be
// sequential or reset — it's stripped and ignored.

export const RAW_EXPENSE_NOTES = `
12/08/2026
1. Royal emirates: 79
2. Noon drinking water: 55

10/08/2026
1. Rak to dubai: 27 + 27 + 7.5
2. Dubai to Rak: 7.5 + 30 + 24

11/08/2026
1. Royal emirates: 19
`;

// ── Types ─────────────────────────────────────────────────────────────────

export interface ParsedExpense {
  title: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  /** One of the app's ExpenseCategory values */
  category: string;
  /** Only set when category === 'other' */
  customCategory?: string;
}

// ── Category inference ───────────────────────────────────────────────────
// Keyword rules, checked in order — first match wins. Entries that match
// nothing fall back to 'other' / 'Miscellaneous' rather than guessing wrong.
// Add rules here as your notepad vocabulary grows, or hardcode a one-off
// override in KNOWN_TITLES below if a specific title needs a specific bucket.

const KNOWN_TITLES: Record<string, { category: string; customCategory?: string }> = {
  // Confirmed by the user — these titles recur without a "Grocery" prefix
  'royal emirates': { category: 'grocery' },
  'all day':        { category: 'grocery' },
};

const KEYWORD_RULES: { pattern: RegExp; category: string; customCategory?: string }[] = [
  { pattern: /water/i,                                      category: 'water' },
  { pattern: /electric/i,                                   category: 'electricity' },
  { pattern: /\brent\b/i,                                   category: 'rent' },
  { pattern: /grocery|supermarket|\bmarket\b|\bmart\b|\bveg/i, category: 'grocery' },
  { pattern: /phone|mobile|etisalat|\bdu\b/i,               category: 'phone' },
  { pattern: /movie|netflix|cinema|entertain/i,             category: 'entertainment' },
  { pattern: /equipment|utensil|\btool/i,                   category: 'equipment' },
  { pattern: /dinner|lunch|breakfast|restaurant|\bfood\b/i, category: 'other', customCategory: 'Dining' },
  // Taxi rides, "travel", or "X to Y" all read as a trip/commute
  { pattern: /\btaxi\b|\btravel\b|\bto\b/i,                 category: 'other', customCategory: 'Travel' },
];

function inferCategory(title: string): { category: string; customCategory?: string } {
  const known = KNOWN_TITLES[title.trim().toLowerCase()];
  if (known) return known;

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(title)) {
      return { category: rule.category, customCategory: rule.customCategory };
    }
  }

  return { category: 'other', customCategory: 'Miscellaneous' };
}

// ── Parsing ───────────────────────────────────────────────────────────────

/** DD/MM/YYYY -> YYYY-MM-DD */
function toISODate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** "27 + 27 + 7.5" -> 61.5 */
function sumAmountExpr(expr: string): number {
  return expr.split('+').reduce((sum, part) => sum + parseFloat(part.trim()), 0);
}

const DATE_LINE = /^(\d{2}\/\d{2}\/\d{4})$/;
const ITEM_LINE = /^\d+\.\s*(.+?):\s*(.+)$/;

/**
 * Parses the "date header, numbered items" notepad format into structured
 * expense records. Throws on any line it can't place, so a formatting typo
 * fails loudly at parse time instead of silently dropping an entry.
 */
export function parseExpenseNotes(raw: string): ParsedExpense[] {
  const expenses: ParsedExpense[] = [];
  let currentDate: string | null = null;

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const dateMatch = DATE_LINE.exec(line);
    if (dateMatch) {
      currentDate = toISODate(dateMatch[1]);
      continue;
    }

    const itemMatch = ITEM_LINE.exec(line);
    if (itemMatch) {
      if (!currentDate) {
        throw new Error(`Expense item appeared before any date header: "${line}"`);
      }
      const [, title, amountExpr] = itemMatch;
      const { category, customCategory } = inferCategory(title);
      expenses.push({
        title: title.trim(),
        amount: sumAmountExpr(amountExpr),
        date: currentDate,
        category,
        customCategory,
      });
      continue;
    }

    throw new Error(`Could not parse expense-notes line: "${line}"`);
  }

  return expenses;
}

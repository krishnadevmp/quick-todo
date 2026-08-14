import { test, expect } from '@playwright/test';
import { RAW_EXPENSE_NOTES, parseExpenseNotes } from './fixtures/expense-notes';

// One generated test per notepad entry — each runs in its own fresh,
// isolated browser context (Playwright's default), so there's no shared
// state between entries and no real app data is touched.
const expenses = parseExpenseNotes(RAW_EXPENSE_NOTES);

test.describe('Add expenses from notepad import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Expenses/ }).click();
  });

  for (const expense of expenses) {
    test(`adds "${expense.title}" — ${expense.amount} on ${expense.date}`, async ({ page }) => {
      // Open the add picker (Sidebar's "Add" button) and choose "New Expense"
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('button', { name: 'New Expense' }).click();

      // Fill the form
      await page.getByPlaceholder(/Expense title/).fill(expense.title);
      await page.getByPlaceholder('0.00').fill(String(expense.amount));
      await page.locator('input[type="date"]').fill(expense.date);
      await page.locator('select').selectOption(expense.category);
      if (expense.category === 'other' && expense.customCategory) {
        await page.getByPlaceholder(/Subscriptions/).fill(expense.customCategory);
      }

      // exact: true — the empty-state's "+ Add Expense" CTA also matches "Add Expense" as a substring
      await page.getByRole('button', { name: 'Add Expense', exact: true }).click();

      // Save succeeded and the overlay closed
      await expect(page.getByText('Expense added')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Expense', exact: true })).toBeHidden();

      // Shows up in the day-grouped list
      await expect(page.getByText(expense.title, { exact: true })).toBeVisible();
    });
  }
});

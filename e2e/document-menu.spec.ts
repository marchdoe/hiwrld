import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

const TEST_DOC = 'e2emenu';

// Sets up two documents and leaves the page on the second one.
async function createTwoDocuments(
  page: Page,
  firstText: string,
  secondText: string
): Promise<void> {
  await page.goto(`/${TEST_DOC}`);
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  const firstDocUrl = page.url();
  await fillTextarea(page, firstText);
  await page.waitForTimeout(800);
  await page.locator('.el__addButton').click();
  await page.waitForURL((u) => u.href !== firstDocUrl);
  await fillTextarea(page, secondText);
  await page.waitForTimeout(800);
}

test.describe('document menu', () => {
  test('menu button toggles the drawer visible', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    const menu = page.locator('.dmenu__list');
    // Drawer starts hidden via CSS; toggling makes it visible
    await page.locator('.el__menuButton').click();
    await expect(menu).toBeVisible();
  });

  test('add button creates a new document and switches to it', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
    const firstDocUrl = page.url();
    await fillTextarea(page, 'first');
    await page.waitForTimeout(800);
    await page.locator('.el__addButton').click();
    await page.waitForURL((u) => u.href !== firstDocUrl);
    await expect(page).not.toHaveURL(firstDocUrl);
    await expect(page.locator('.document-textarea')).toHaveValue('');
  });

  test('clicking a menu item switches to that document', async ({ page }) => {
    await createTwoDocuments(page, '# Doc One', '# Doc Two');

    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__list')).toBeVisible();
    const docOneItem = page.locator('.dmenu__item', { hasText: 'Doc One' });
    await docOneItem.click();
    await expect(page.locator('.document-textarea')).toHaveValue('# Doc One');
  });

  test('delete button removes a document from the menu', async ({ page }) => {
    await createTwoDocuments(page, '# Keep', '# Delete');

    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__list')).toBeVisible();
    const items = page.locator('.dmenu__list li.dmenu__item');
    await expect(items).toHaveCount(2);

    const urlBeforeDelete = page.url();
    await page.locator('.dmenu__item', { hasText: 'Delete' }).locator('.dmenu__deleteBtn').click();
    // Deleting the current document navigates away — wait for that before asserting count
    await page.waitForURL((u) => u.href !== urlBeforeDelete);
    await expect(items).toHaveCount(1);
  });

  test('delete button removes a background document without navigating', async ({ page }) => {
    await createTwoDocuments(page, '# Keep', '# Active');

    // Navigate to Keep so Active is the background document
    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__list')).toBeVisible();
    const keepItem = page.locator('.dmenu__item', { hasText: 'Keep' });
    await keepItem.click();
    await expect(page.locator('.document-textarea')).toHaveValue('# Keep');

    // Reopen menu and delete the Active background document
    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__list')).toBeVisible();
    const currentUrl = page.url();
    const items = page.locator('.dmenu__list li.dmenu__item');
    await expect(items).toHaveCount(2);

    await page.locator('.dmenu__item', { hasText: 'Active' }).locator('.dmenu__deleteBtn').click();

    // No navigation should happen — URL stays the same
    await expect(page).toHaveURL(currentUrl);
    await expect(items).toHaveCount(1);
    await expect(page.locator('.dmenu__item', { hasText: 'Keep' })).toBeVisible();
  });
});

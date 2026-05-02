import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

// Sets up two documents and leaves the page on the second one.
async function createTwoDocuments(
  page: Page,
  firstText: string,
  secondText: string
): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  const firstDocUrl = page.url();
  await fillTextarea(page, firstText);
  await page.waitForTimeout(800);
  await page.locator('.add-button').click();
  await page.waitForURL((u) => u.href !== firstDocUrl);
  await fillTextarea(page, secondText);
  await page.waitForTimeout(800);
}

test.describe('document menu', () => {
  test('menu button toggles the drawer visible', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.document-menu');
    // Drawer starts hidden via CSS; toggling makes it visible
    await page.locator('.menu-button').click();
    await expect(menu).toBeVisible();
  });

  test('add button creates a new document and switches to it', async ({ page }) => {
    await page.goto('/');
    // Wait for the router redirect from / to /$docId before capturing the URL
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
    const firstDocUrl = page.url();
    await fillTextarea(page, 'first');
    await page.waitForTimeout(800);
    await page.locator('.add-button').click();
    await page.waitForURL((u) => u.href !== firstDocUrl);
    await expect(page).not.toHaveURL(firstDocUrl);
    await expect(page.locator('.document-textarea')).toHaveValue('');
  });

  test('clicking a menu item switches to that document', async ({ page }) => {
    await createTwoDocuments(page, '# Doc One', '# Doc Two');

    await page.locator('.menu-button').click();
    await expect(page.locator('.document-menu')).toBeVisible();
    const docOneItem = page.locator('.document-menu-item', { hasText: 'Doc One' });
    await docOneItem.click();
    await expect(page.locator('.document-textarea')).toHaveValue('# Doc One');
  });

  test('delete button removes a document from the menu', async ({ page }) => {
    await createTwoDocuments(page, '# Keep', '# Delete');

    await page.locator('.menu-button').click();
    await expect(page.locator('.document-menu')).toBeVisible();
    const items = page.locator('.document-menu li.document-menu-item');
    await expect(items).toHaveCount(2);

    await page
      .locator('.document-menu-item', { hasText: 'Delete' })
      .locator('.document-menu-item-delete-button')
      .click();
    await expect(items).toHaveCount(1);
  });
});

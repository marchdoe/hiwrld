import { expect, test } from '@playwright/test';
import { fillTextarea, openDoc } from './helpers';

test.describe('persistence', () => {
  test('content survives a full reload via localStorage', async ({ page, context }) => {
    const { page: a, url } = await openDoc(context);
    await page.close();

    await fillTextarea(a, 'persist me');
    // debounced save is 500ms
    await a.waitForTimeout(800);
    await a.reload();
    await expect(a).toHaveURL(url);
    await expect(a.locator('.document-textarea')).toHaveValue('persist me');
  });

  test('navigating directly to an existing doc URL loads its content', async ({
    page,
    context,
  }) => {
    // Creator page: create a doc and type
    const { page: creator, url } = await openDoc(context);
    await fillTextarea(creator, 'pre-existing content');
    await creator.waitForTimeout(800);
    await creator.close();

    // Deep-link from the fixture page to the same URL
    await page.goto(url);
    await expect(page.locator('.document-textarea')).toHaveValue('pre-existing content', {
      timeout: 2000,
    });
  });

  test('bookmarks list persists across reloads', async ({ page, context }) => {
    const { page: a } = await openDoc(context);
    await page.close();

    await fillTextarea(a, 'first doc');
    await a.waitForTimeout(800);

    const firstDocUrl = a.url();
    await a.locator('.add-button').click();
    await a.waitForURL((u) => u.href !== firstDocUrl);
    await fillTextarea(a, 'second doc');
    await a.waitForTimeout(800);

    await a.reload();
    await a.locator('.menu-button').click();
    await expect(a.locator('.document-menu')).toBeVisible();
    const items = a.locator('.document-menu li.document-menu-item');
    await expect(items).toHaveCount(2);
  });
});

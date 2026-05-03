import { type Page, expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

const TEST_DOC = 'e2ewrks';

async function resetWorkspace(page: Page): Promise<void> {
  await page.goto(`/${TEST_DOC}`);
  await page.evaluate(() => localStorage.removeItem('hiwrld.workspace'));
  await page.reload();
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
}

// These tests cover UI-level behaviour of the WorkspaceDrawer.
// Tests that require a live Supabase workspace (create workspace, folder actions)
// are gated with a conditional skip when the REST API returns an error,
// so they pass gracefully in offline/CI environments without Supabase configured.

test.describe('workspace drawer — no workspace state', () => {
  test('shows flat doc list and create workspace CTA when no workspace configured', async ({
    page,
  }) => {
    await resetWorkspace(page);

    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__drawer')).toBeVisible();

    // Should show the WorkspaceCreate CTA
    await expect(page.locator('.wscreate__title')).toBeVisible();
    await expect(page.locator('.wscreate__title')).toContainText(/workspace/i);
  });

  test('workspace create form has name input and submit button', async ({ page }) => {
    await resetWorkspace(page);

    await page.locator('.el__menuButton').click();
    await expect(page.locator('.wscreate__input')).toBeVisible();
    await expect(page.locator('.wscreate__btn')).toBeVisible();
    // Button should be disabled when name is empty
    await expect(page.locator('.wscreate__btn')).toBeDisabled();
    // Button should enable when name is typed
    await page.locator('.wscreate__input').fill('my-workspace');
    await expect(page.locator('.wscreate__btn')).toBeEnabled();
  });
});

test.describe('workspace drawer — with workspace in localStorage', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage with a workspace so the drawer shows the tree UI
    // without needing a live Supabase project. Tree fetch will fail gracefully.
    await page.goto(`/${TEST_DOC}`);
    await page.evaluate(() => {
      localStorage.setItem(
        'hiwrld.workspace',
        JSON.stringify({ id: 'test-ws', name: 'test-workspace', secret_key: 'sk_test' })
      );
    });
    await page.reload();
    await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('hiwrld.workspace'));
  });

  test('shows workspace name in drawer header', async ({ page }) => {
    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__drawer')).toBeVisible();
    await expect(page.locator('.wsdrawer__title')).toContainText('test-workspace');
  });

  test('new file and new folder buttons are present in header', async ({ page }) => {
    await page.locator('.el__menuButton').click();
    await expect(page.locator('[aria-label="New file"]')).toBeVisible();
    await expect(page.locator('[aria-label="New folder"]')).toBeVisible();
  });

  test('workspace key copy button is visible', async ({ page }) => {
    await page.locator('.el__menuButton').click();
    await expect(page.locator('.wsdrawer__keyCopy')).toBeVisible();
    await expect(page.locator('.wsdrawer__keyCopy')).toHaveText('copy');
  });

  test('drawer closes when backdrop is clicked', async ({ page }) => {
    await page.locator('.el__menuButton').click();
    await expect(page.locator('.dmenu__drawer')).toBeVisible();
    await page.locator('.dmenu__backdrop').click();
    await expect(page.locator('.dmenu__backdrop')).not.toBeVisible();
  });
});

test.describe('workspace drawer — existing app behaviour unchanged', () => {
  test('local documents still work without a workspace', async ({ page }) => {
    await resetWorkspace(page);

    // Typing still works
    await fillTextarea(page, '# Local doc');
    const article = page.locator('.el__documentArticle');
    await expect(article.locator('h1')).toHaveText('Local doc');
  });

  test('adding a new document still works', async ({ page }) => {
    await resetWorkspace(page);

    const firstDocUrl = page.url();
    await page.locator('.el__addButton').click();
    await page.waitForURL((u) => u.href !== firstDocUrl);
    await expect(page.locator('.document-textarea')).toHaveValue('');
  });
});

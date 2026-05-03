import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

const TEST_DOC = 'e2esant';

async function assertNotAlertedAndStripped(
  page: Page,
  markdown: string,
  htmlPattern: RegExp
): Promise<void> {
  await page.goto(`/${TEST_DOC}`);
  let alerted = false;
  page.on('dialog', async (d) => {
    alerted = true;
    await d.dismiss();
  });
  await fillTextarea(page, markdown);
  await page.waitForTimeout(500);
  expect(alerted).toBe(false);
  const html = await page.locator('.document-article').innerHTML();
  expect(html).not.toMatch(htmlPattern);
}

async function assertStripped(page: Page, markdown: string, htmlPattern: RegExp): Promise<void> {
  await page.goto(`/${TEST_DOC}`);
  await fillTextarea(page, markdown);
  await page.waitForTimeout(500);
  const html = await page.locator('.document-article').innerHTML();
  expect(html).not.toMatch(htmlPattern);
}

test.describe('sanitization', () => {
  test('strips inline <script> tags from preview', async ({ page }) => {
    await assertNotAlertedAndStripped(page, 'hi <script>window.alert(1)</script> bye', /<script/i);
  });

  test('strips onerror handlers from img tags', async ({ page }) => {
    await assertNotAlertedAndStripped(page, '<img src=x onerror="window.alert(1)">', /onerror/i);
  });

  test('strips iframes with javascript: src', async ({ page }) => {
    await assertStripped(page, '<iframe src="javascript:alert(1)"></iframe>', /javascript:/i);
  });

  test('strips javascript: protocol from links', async ({ page }) => {
    await assertStripped(page, '[click](javascript:alert(1))', /javascript:/i);
  });
});

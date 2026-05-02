import { expect, test } from '@playwright/test';

async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
}

test.describe('sanitization', () => {
  test('strips inline <script> tags from preview', async ({ page }) => {
    await page.goto('/');
    let alerted = false;
    page.on('dialog', async (d) => {
      alerted = true;
      await d.dismiss();
    });
    await fillTextarea(page, 'hi <script>window.alert(1)</script> bye');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/<script/i);
  });

  test('strips onerror handlers from img tags', async ({ page }) => {
    await page.goto('/');
    let alerted = false;
    page.on('dialog', async (d) => {
      alerted = true;
      await d.dismiss();
    });
    await fillTextarea(page, '<img src=x onerror="window.alert(1)">');
    await page.waitForTimeout(500);
    expect(alerted).toBe(false);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/onerror/i);
  });

  test('strips iframes with javascript: src', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, '<iframe src="javascript:alert(1)"></iframe>');
    await page.waitForTimeout(500);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/javascript:/i);
  });

  test('strips javascript: protocol from links', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, '[click](javascript:alert(1))');
    await page.waitForTimeout(500);
    const html = await page.locator('.document-article').innerHTML();
    expect(html).not.toMatch(/javascript:/i);
  });
});

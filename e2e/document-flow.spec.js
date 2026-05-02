import { expect, test } from '@playwright/test';

async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
}

test.describe('document flow', () => {
  test('landing redirects to a doc URL with a 7-char id', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/[A-Za-z0-9]{7}$/);
  });

  test('typing in the textarea updates the preview', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, '# Hello\n\nworld');
    const article = page.locator('.document-article');
    await expect(article.locator('h1')).toHaveText('Hello');
    await expect(article.locator('p')).toHaveText('world');
  });

  test('smart quotes curl in the preview', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, 'it\'s a "test"');
    const article = page.locator('.document-article');
    // Wait for the article to reflect the typed content before reading innerHTML.
    await expect(article.locator('p')).toBeVisible();
    const html = await article.innerHTML();
    expect(html).toContain('it’s');
    expect(html).toContain('“test”');
  });

  test('fenced code blocks get syntax highlighting', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, '```js\nconst x = 1;\n```');
    const code = page.locator('.document-article pre code');
    await expect(code).toBeVisible();
    // hljs adds class names like hljs-keyword, hljs-number after highlight
    await expect(code.locator('.hljs-keyword')).toBeVisible();
  });

  test('youtube watch links become embedded iframes', async ({ page }) => {
    await page.goto('/');
    await fillTextarea(page, 'see [video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    const iframe = page.locator('.document-article iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]');
    // The youtube filter is debounced 1s — wait for it.
    await expect(iframe).toBeVisible({ timeout: 3000 });
  });
});

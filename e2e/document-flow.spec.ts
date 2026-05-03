import { expect, test } from '@playwright/test';
import { fillTextarea } from './helpers';

const TEST_DOC = 'e2eflow';

test.describe('document flow', () => {
  test('landing page renders at /', async ({ page }) => {
    await page.goto('/');
    // The landing page should be visible, not a redirect
    await expect(page.locator('text=write.')).toBeVisible();
  });

  test('typing in the textarea updates the preview', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    await fillTextarea(page, '# Hello\n\nworld');
    const article = page.locator('.el__documentArticle');
    await expect(article.locator('h1')).toHaveText('Hello');
    await expect(article.locator('p')).toHaveText('world');
  });

  test('smart quotes curl in the preview', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    await fillTextarea(page, 'it\'s a "test"');
    const article = page.locator('.el__documentArticle');
    // Wait for the article to reflect the typed content before reading innerHTML.
    await expect(article.locator('p')).toBeVisible();
    const html = await article.innerHTML();
    expect(html).toContain('’'); // right single quotation mark (curly apostrophe)
    expect(html).toContain('“'); // left double quotation mark
  });

  test('fenced code blocks get syntax highlighting', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    await fillTextarea(page, '```js\nconst x = 1;\n```');
    const code = page.locator('.el__documentArticle pre code');
    await expect(code).toBeVisible();
    // hljs adds class names like hljs-keyword, hljs-number after highlight
    await expect(code.locator('.hljs-keyword')).toBeVisible();
  });

  test('youtube watch links become embedded iframes', async ({ page }) => {
    await page.goto(`/${TEST_DOC}`);
    await fillTextarea(page, 'see [video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    const iframe = page.locator(
      '.el__documentArticle iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]'
    );
    // The youtube filter is debounced 1s — wait for it.
    await expect(iframe).toBeVisible({ timeout: 3000 });
  });
});

import type { BrowserContext, Page } from '@playwright/test';

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function generateDocId(): string {
  let id = '';
  for (let i = 0; i < 7; i++) {
    id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return id;
}

export async function fillTextarea(page: Page, text: string): Promise<void> {
  await page.locator('.document-textarea').fill(text);
}

export async function openDoc(context: BrowserContext): Promise<{ page: Page; url: string }> {
  const page = await context.newPage();
  const docId = generateDocId();
  await page.goto(`/${docId}`);
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  return { page, url: page.url() };
}

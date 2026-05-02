import type { BrowserContext, Page } from '@playwright/test';

export async function fillTextarea(page: Page, text: string): Promise<void> {
  await page.locator('.document-textarea').fill(text);
}

export async function openDoc(context: BrowserContext): Promise<{ page: Page; url: string }> {
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  return { page, url: page.url() };
}

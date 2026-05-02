export async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
}

export async function openDoc(context) {
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  return { page, url: page.url() };
}

import { expect, test } from '@playwright/test';

// All scenarios use multiple pages within ONE context so they share
// BroadcastChannel + localStorage. (Different contexts are isolated.)

async function fillTextarea(page, text) {
  await page.locator('.document-textarea').fill(text);
}

// Helper: navigate to '/' and wait for the app to redirect to the doc path URL,
// then return the page so subsequent pages can join the same document.
async function openDoc(context) {
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForURL(/\/[A-Za-z0-9]{7}$/);
  return page;
}

test.describe('concurrent edits — last-write-wins via BroadcastChannel', () => {
  test('read replication: A types, B observes within 1s', async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();

    const b = await context.newPage();
    await b.goto(url);

    await fillTextarea(a, 'hello from A');
    await expect(b.locator('.document-article p')).toHaveText('hello from A', { timeout: 1000 });
  });

  test('simultaneous typing: state converges across both clients', async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    // Two writes in quick succession — last write wins
    await fillTextarea(a, 'first from A');
    await fillTextarea(b, 'first from B');

    // Wait for sync (debounced save is 500ms)
    await a.waitForTimeout(1500);

    // Both clients converge on the same final state
    const aBody = await a.locator('.document-textarea').inputValue();
    const bBody = await b.locator('.document-textarea').inputValue();
    expect(aBody).toBe(bBody);
  });

  test('rapid alternation: A, B, A, B → both end on the same string', async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    await fillTextarea(a, 'a-1');
    await a.waitForTimeout(700);
    await fillTextarea(b, 'b-1');
    await b.waitForTimeout(700);
    await fillTextarea(a, 'a-2');
    await a.waitForTimeout(700);
    await fillTextarea(b, 'b-2');
    await b.waitForTimeout(1500);

    expect(await a.locator('.document-textarea').inputValue()).toBe(
      await b.locator('.document-textarea').inputValue()
    );
  });

  test("late joiner: B opens URL fresh and sees A's content", async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();
    await fillTextarea(a, 'typed before B joined');
    await a.waitForTimeout(800); // let debounced save fire

    const b = await context.newPage();
    await b.goto(url);
    await expect(b.locator('.document-article p')).toHaveText('typed before B joined', {
      timeout: 2000,
    });
  });

  test('three-way: convergence scales past two clients', async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);
    const c = await context.newPage();
    await c.goto(url);

    await fillTextarea(a, 'from A');
    await a.waitForTimeout(700);
    await fillTextarea(b, 'from B');
    await b.waitForTimeout(700);
    await fillTextarea(c, 'from C');
    await c.waitForTimeout(1500);

    const aBody = await a.locator('.document-textarea').inputValue();
    const bBody = await b.locator('.document-textarea').inputValue();
    const cBody = await c.locator('.document-textarea').inputValue();
    expect(aBody).toBe(bBody);
    expect(bBody).toBe(cBody);
  });

  test('disconnect / reconnect: B catches up after A keeps typing', async ({ context }) => {
    const a = await openDoc(context);
    const url = a.url();
    const b = await context.newPage();
    await b.goto(url);

    await fillTextarea(a, 'initial');
    await a.waitForTimeout(700);
    await expect(b.locator('.document-article p')).toHaveText('initial');

    await b.close();

    await fillTextarea(a, 'typed while B was gone');
    await a.waitForTimeout(700);

    const b2 = await context.newPage();
    await b2.goto(url);
    await expect(b2.locator('.document-article p')).toHaveText('typed while B was gone', {
      timeout: 2000,
    });
  });
});

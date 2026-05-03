import { chromium } from '@playwright/test';
import { join } from 'path';
import { mkdirSync } from 'fs';

const HTML_SRC = join(process.cwd(), 'src/assets/og-source.html');
const OUT      = join(process.cwd(), 'public/og.png');

mkdirSync(join(process.cwd(), 'public'), { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`file://${HTML_SRC}`);

  // Wait for Geist to load from Google Fonts
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();

  console.log(`✓ og.png saved to ${OUT}`);
}

main().catch(console.error);

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SVG_SRC = join(process.cwd(), 'src/assets/favicon.svg');
const PUBLIC = join(process.cwd(), 'public');

mkdirSync(PUBLIC, { recursive: true });

// Copy SVG as-is for the <link rel="icon" type="image/svg+xml"> tag
copyFileSync(SVG_SRC, join(PUBLIC, 'favicon.svg'));

const sizes = [16, 32, 48, 64, 96, 128, 180, 192, 512];

async function main() {
  for (const size of sizes) {
    const name =
      size === 180
        ? 'favicon-180.png' // apple-touch-icon
        : size === 32
          ? 'favicon.ico' // browsers prefer .ico at 32px
          : `favicon-${size}.png`;

    await sharp(SVG_SRC)
      .resize(size, size)
      .png()
      .toFile(join(PUBLIC, name === 'favicon.ico' ? 'favicon.ico' : name));

    console.log(`✓ ${name} (${size}×${size})`);
  }

  // Maskable variant: 512px with 20% safe-zone padding (80% content area)
  await sharp(SVG_SRC)
    .resize(410, 410) // 80% of 512
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#1f1d1a' })
    .png()
    .toFile(join(PUBLIC, 'favicon-512-maskable.png'));

  console.log('✓ favicon-512-maskable.png (512×512 with safe zone)');
}

main().catch(console.error);

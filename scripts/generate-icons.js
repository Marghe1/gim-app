import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Simple icon SVG with dumbbell
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#16c79a"/>
  <g fill="white">
    <rect x="76" y="204" width="360" height="104" rx="20"/>
    <rect x="128" y="153" width="52" height="206" rx="16"/>
    <rect x="332" y="153" width="52" height="206" rx="16"/>
    <rect x="51" y="179" width="77" height="154" rx="20"/>
    <rect x="384" y="179" width="77" height="154" rx="20"/>
  </g>
</svg>
`;

async function generateIcons() {
  const svgBuffer = Buffer.from(iconSvg);

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  console.log('All icons generated!');
}

generateIcons().catch(console.error);

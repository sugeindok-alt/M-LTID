import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ingredients } from '../src/data/ingredients';

// Run from the repository root. A public check fetches each actual file and
// decodes it, so an HTTP 200 HTML error page cannot pass as an image.
const origin = process.argv.includes('--live') ? 'https://m-ltid.vercel.app' : '';
const makeSheet = process.argv.includes('--contact');
const rows = [...ingredients].sort((a, b) => a.name.localeCompare(b.name, 'nn'));
const tiles: { input: Buffer; left: number; top: number }[] = [];
const cols = 8,
  cell = 156,
  rowHeight = 178;
const names = new Set<string>();
const escape = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let total = 0;
for (const [i, item] of rows.entries()) {
  if (!item.image || names.has(item.image))
    throw new Error('Manglande eller delt bilete: ' + item.name);
  names.add(item.image);
  const disk = path.join('public', item.image);
  total += (await stat(disk)).size;
  let source: string | Buffer = disk;
  if (origin) {
    const response = await fetch(origin + item.image);
    if (!response.ok) throw new Error(item.name + ': HTTP ' + response.status);
    source = Buffer.from(await response.arrayBuffer());
  }
  const { format, width, height } = await sharp(source).metadata();
  if (origin) await sharp(source).resize(8, 8).raw().toBuffer();
  if (format !== 'webp' || !width || width !== height || width < 300)
    throw new Error('Uventa format: ' + item.name);
  if (makeSheet) {
    const left = (i % cols) * cell,
      top = Math.floor(i / cols) * rowHeight;
    tiles.push({
      input: await sharp(source).resize(134, 134).png().toBuffer(),
      left: left + 11,
      top: top + 5,
    });
    tiles.push({
      input: Buffer.from(
        `<svg width="${cell}" height="32" xmlns="http://www.w3.org/2000/svg"><text x="78" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#20382c">${escape(item.name)}</text></svg>`,
      ),
      left,
      top: top + 140,
    });
  }
}
if (makeSheet) {
  await mkdir('docs', { recursive: true });
  await sharp({
    create: {
      width: cols * cell,
      height: Math.ceil(rows.length / cols) * rowHeight,
      channels: 3,
      background: '#f7f5ee',
    },
  })
    .composite(tiles)
    .jpeg({ quality: 88 })
    .toFile('docs/raw-image-contact.jpg');
}
console.log(
  `${names.size}/${rows.length} råvarer med ulikt, lesbart WebP-bilete. ${Math.round(total / 1024)} KiB til saman. Kjelde: ${origin || 'lokale filer'}.`,
);

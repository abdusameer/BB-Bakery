/*
  Publishes the Pages build (dist/, built with PAGES_BASE=/BB-Bakery/) to the repository root,
  which GitHub Pages serves ("Deploy from a branch: main / (root)").
  Only the site's own entries at the root are replaced: index.html, assets/, img/, favicon.svg, .nojekyll.
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(site, 'dist');
const root = path.resolve(site, '..');
const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
if (!html.includes('/BB-Bakery/')) throw new Error('dist was not built with PAGES_BASE=/BB-Bakery/');
for (const entry of ['index.html', 'assets', 'img', 'favicon.svg']) {
  await fs.rm(path.join(root, entry), { recursive: true, force: true });
  await fs.cp(path.join(dist, entry), path.join(root, entry), { recursive: true });
}
await fs.writeFile(path.join(root, '.nojekyll'), '');
console.log('published dist → repo root (index.html, assets/, img/, favicon.svg, .nojekyll)');

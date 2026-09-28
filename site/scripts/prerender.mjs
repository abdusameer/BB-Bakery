/* Injects the server-rendered app into dist/index.html so the page is complete before JS runs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-server.js')).href);
const file = path.join(root, 'dist/index.html');
const html = await fs.readFile(file, 'utf8');
if (!html.includes('<!--app-html-->')) throw new Error('placeholder missing in dist/index.html');
await fs.writeFile(file, html.replace('<!--app-html-->', render()));
await fs.rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });
console.log('prerendered dist/index.html');

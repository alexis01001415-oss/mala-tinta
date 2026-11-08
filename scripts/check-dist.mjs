import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Validate what will actually be uploaded, including unprocessed public CSS.
// Usage: VITE_BASE_PATH=/repository/ node scripts/check-dist.mjs [dist-directory]
const root = path.resolve(process.argv[2] || 'dist');
const base = process.env.VITE_BASE_PATH || '/';
if (!base.startsWith('/') || !base.endsWith('/') || base.includes('..') || base.includes('://')) {
  throw new Error(`Expected a site path beginning and ending with '/'; received ${base}`);
}
const origin = 'https://pages-check.invalid';
const errors = new Set();
const files = [];
let bytes = 0;
let references = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.add(`Unsupported symbolic link: ${path.relative(root, filename)}`);
    } else if (entry.isDirectory()) {
      await walk(filename);
    } else if (entry.isFile()) {
      files.push(filename);
      bytes += (await stat(filename)).size;
    }
  }
}
await walk(root);
const relative = (filename) => path.relative(root, filename).split(path.sep).join('/');
const available = new Set(files.map(relative));
if (!available.has('index.html')) errors.add('Missing dist/index.html');
if (bytes > 1024 ** 3) errors.add('Published output exceeds the GitHub Pages 1 GB size limit');

function checkReference(raw, filename, { asset = true } = {}) {
  const value = raw.trim().replace(/&amp;/g, '&');
  if (!value || /^(?:#|data:|blob:|mailto:|tel:|javascript:)/i.test(value)) return;
  if (/^(?:https?:)?\/\//i.test(value)) return;
  let url;
  try { url = new URL(value, `${origin}${base}${relative(filename)}`); }
  catch { errors.add(`${relative(filename)}: invalid URL ${value}`); return; }
  if (url.origin !== origin) return;
  references++;
  if (!url.pathname.startsWith(base)) {
    errors.add(`${relative(filename)}: ${value} escapes deployment base ${base}`);
    return;
  }
  const local = decodeURIComponent(url.pathname.slice(base.length));
  const candidate = local.endsWith('/') ? `${local}index.html` : local;
  const isResourceDirectory = filename.endsWith('.js') && local.endsWith('/') && [...available].some((item) => item.startsWith(local));
  if (asset && !available.has(candidate) && !isResourceDirectory) errors.add(`${relative(filename)}: missing ${candidate}`);
}

for (const filename of files) {
  if (!/\.(?:html|css|js)$/i.test(filename)) continue;
  const text = await readFile(filename, 'utf8');
  if (filename.endsWith('.html')) {
    const ids = new Set([...text.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
    for (const match of text.matchAll(/(?:^|\s)(src|href|poster|data-photo)\s*=\s*(["'])(.*?)\2/g)) {
      const value = match[3];
      if (match[1] === 'href' && /^#[^#]/.test(value)) {
        if (!ids.has(decodeURIComponent(value.slice(1)))) errors.add(`${relative(filename)}: missing target ${value}`);
      } else checkReference(value, filename);
    }
    for (const match of text.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/g)) {
      for (const item of match[2].split(',')) checkReference(item.trim().split(/\s+/)[0], filename);
    }
  }
  if (filename.endsWith('.css') || filename.endsWith('.html')) {
    for (const match of text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g)) {
      checkReference(match[1] || match[2] || match[3], filename);
    }
  }
  if (filename.endsWith('.js')) {
    // Vite resolves ordinary CSS/HTML assets; raw JS strings need BASE_URL explicitly.
    for (const match of text.matchAll(/(["'`])(\/(?:images|models|fonts)\/[^"'`\s]+)\1/g)) {
      checkReference(match[2], filename, { asset: !match[2].includes('${') });
    }
    // Built module chunks must exist, whether statically or lazily imported.
    for (const match of text.matchAll(/(?:from\s*|import\s*\(\s*)(["'])(\.[^"']+\.js)\1/g)) {
      checkReference(match[2], filename);
    }
  }
}

if (errors.size) {
  console.error(`Deployment validation failed (${errors.size} issue${errors.size === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${references} references in ${files.length} files; ${(bytes / 1024 ** 2).toFixed(2)} MiB; base ${base}`);
}

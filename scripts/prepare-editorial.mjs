import sharp from 'sharp';
import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const generated = process.argv[2] || process.env.MALA_TINTA_GENERATED_DIR;
if (!generated) {
  console.error('Usage: node scripts/prepare-editorial.mjs <directory-containing-source-images>');
  console.error('Alternatively set MALA_TINTA_GENERATED_DIR. Source images are not required to build the website.');
  process.exit(1);
}
const output = fileURLToPath(new URL('../public/images/editorial/', import.meta.url));
const files = {
  owner: 'exec-376bbb8c-53ca-43dd-969d-63dc01b493a1.png',
  blackwork: 'exec-f475d8f1-856e-4f3c-8fc3-865428399ff8.png',
  tradicional: 'exec-0b09e392-68e1-4dbf-8a01-adc39bcfa3ba.png',
  'fine-line': 'exec-b03bef7d-73e6-4463-9a97-ce66d6e4e497.png',
  realismo: 'exec-ba00b7ca-383a-49a6-b3aa-91ddd697f2f1.png',
  preparation: 'exec-71030ad8-5534-4a2f-9a44-954a592cf23f.png',
  consultation: 'exec-d3edfdab-0402-4ae1-a679-caf805aca45a.png',
  care: 'exec-a7fa5602-3faa-4fef-aec6-644e02f61a6a.png',
  studio: 'exec-06d4aa74-26e8-4172-a448-fa8b95076c93.png',
};
const sources = [];
for (const [name, original] of Object.entries(files)) {
  // Named sources make the script reusable; original exports are also accepted.
  const candidates = [`${name}.png`, `${name}.jpg`, `${name}.webp`, original];
  let source;
  for (const file of candidates) {
    try { await access(join(generated, file)); source = join(generated, file); break; }
    catch { /* Try the next supported source filename. */ }
  }
  if (!source) throw new Error(`Missing source for ${name}; expected one of: ${candidates.join(', ')}`);
  sources.push([name, source]);
}
await mkdir(output, {recursive:true});
for (const [name, source] of sources) {
  const result = await sharp(source).resize({width:960,withoutEnlargement:true}).webp({quality:84}).toFile(join(output, `${name}.webp`));
  console.log(name, result.size);
}

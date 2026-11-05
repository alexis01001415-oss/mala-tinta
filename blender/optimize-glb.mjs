import fs from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filename = path.join(root, 'public/models/studio.glb');
const source = await fs.readFile(filename);
const jsonLength = source.readUInt32LE(12);
const document = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
if (document.extensionsUsed?.includes('EXT_texture_webp')) {
  console.log('Already optimized with embedded WebP textures.');
  process.exit(0);
}
const oldBin = source.subarray(28 + jsonLength);
const changedImages = new Map();
for (let i = 0; i < document.images.length; i++) {
  const image = document.images[i];
  const view = document.bufferViews[image.bufferView];
  const bytes = oldBin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  const result = await sharp(bytes).webp({quality:image.name?.includes('nor_gl') ? 90 : 84, effort:6}).toBuffer();
  changedImages.set(image.bufferView, result);
  image.mimeType = 'image/webp';
}
const chunks = [];
let offset = 0;
document.bufferViews.forEach((view, index) => {
  const bytes = changedImages.get(index) ?? oldBin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  view.byteOffset = offset;
  view.byteLength = bytes.length;
  chunks.push(bytes);
  offset += bytes.length;
});
const tailPadding = (4 - offset % 4) % 4;
if (tailPadding) { chunks.push(Buffer.alloc(tailPadding)); offset += tailPadding; }
document.buffers[0].byteLength = offset;
document.textures.forEach(texture => {
  if (texture.source === undefined) return;
  texture.extensions = {...texture.extensions, EXT_texture_webp:{source:texture.source}};
  delete texture.source;
});
document.extensionsUsed = [...(document.extensionsUsed ?? []), 'EXT_texture_webp'];
document.extensionsRequired = [...(document.extensionsRequired ?? []), 'EXT_texture_webp'];
const json = Buffer.from(JSON.stringify(document));
const jsonPadded = Buffer.concat([json, Buffer.alloc((4-json.length%4)%4, 0x20)]);
const binary = Buffer.concat(chunks);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+jsonPadded.length+8+binary.length,8);
const jHeader=Buffer.alloc(8);jHeader.writeUInt32LE(jsonPadded.length,0);jHeader.writeUInt32LE(0x4e4f534a,4);
const bHeader=Buffer.alloc(8);bHeader.writeUInt32LE(binary.length,0);bHeader.writeUInt32LE(0x004e4942,4);
await fs.writeFile(path.join(root,'blender/studio-source.glb'),source);
const output=Buffer.concat([header,jHeader,jsonPadded,bHeader,binary]);
await fs.writeFile(filename,output);
console.log(`GLB: ${source.length} → ${output.length} bytes; Draco geometry unchanged, ${document.images.length} embedded WebP maps.`);

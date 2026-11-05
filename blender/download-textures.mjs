import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const target = path.join(root, 'textures');
await fs.mkdir(target, { recursive: true });
const assets = ['brown_leather', 'weathered_brown_planks', 'plastered_wall_05'];
const records = [];
for (const asset of assets) {
  const data = await fetch(`https://api.polyhaven.com/files/${asset}`).then(r => r.json());
  const info = await fetch(`https://api.polyhaven.com/info/${asset}`).then(r => r.json());
  for (const channel of ['diff', 'nor_gl', 'rough']) {
    const channelKey = Object.keys(data).find(key => key.toLowerCase() === ({diff:'diffuse',rough:'rough',nor_gl:'nor_gl'}[channel]));
    const record = data[channelKey]?.['1k']?.jpg;
    if (!record) throw new Error(`Missing ${channel} ${asset}`);
    const bytes = await fetch(record.url).then(r => r.arrayBuffer());
    const size = channel === 'nor_gl' ? 1024 : 1024;
    await sharp(Buffer.from(bytes)).resize(size, size).jpeg({quality: channel === 'nor_gl' ? 91 : 83, chromaSubsampling:'4:4:4'}).toFile(path.join(target, `${asset}_${channel}.jpg`));
    records.push({asset, channel, source: record.url, page:`https://polyhaven.com/a/${asset}`, license:'CC0', authors:info.authors});
  }
}
await sharp(path.join(root,'../public/images/flash-sheet.webp')).resize(1024,1536).jpeg({quality:88}).toFile(path.join(target,'flash-art.jpg'));
await fs.writeFile(path.join(root,'texture-sources.json'), JSON.stringify(records,null,2));
console.log('Downloaded and optimized 9 CC0 PBR maps plus existing original flash artwork.');

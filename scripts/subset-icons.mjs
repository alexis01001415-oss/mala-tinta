import { readFile, writeFile } from "node:fs/promises";

// Official Google Fonts API: keep only the icons used by this document.
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const icons = [
  ...new Set(
    [...html.matchAll(/class="material-symbols-outlined"[^>]*>([^<]+)</g)].map(
      (match) => match[1].trim(),
    ),
  ),
].sort();
const url = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=${icons.join(",")}&display=block`;
const response = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
  },
});
if (!response.ok) throw new Error(`Google Fonts: ${response.status}`);
const css = await response.text();
const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
if (!fontUrl?.startsWith("https://fonts.gstatic.com/"))
  throw new Error("Unexpected font source");
const font = await fetch(fontUrl);
if (!font.ok) throw new Error(`Font: ${font.status}`);
const bytes = new Uint8Array(await font.arrayBuffer());
await writeFile(
  new URL("../public/fonts/material-symbols-subset.woff2", import.meta.url),
  bytes,
);
await writeFile(
  new URL("../public/fonts/material-symbols-source.txt", import.meta.url),
  `Google Material Symbols — Apache License 2.0\n${url}\n${fontUrl}\nIcons: ${icons.join(", ")}\n`,
);
console.log(`Self-hosted ${icons.length} Google icons: ${bytes.length} bytes.`);

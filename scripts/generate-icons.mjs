/**
 * Generates Play Store triangle icons for PWA + favicons.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import sharp from "sharp";

mkdirSync("public/icons", { recursive: true });

const PLAY_LOGO_PATHS = `
  <clipPath id="play-rounded">
    <path d="M 124 92
             C 112 85 96 94 96 110
             L 96 402
             C 96 418 112 427 124 420
             L 396 269
             C 410 261 410 251 396 243
             Z" />
  </clipPath>
  <g clip-path="url(#play-rounded)">
    <polygon points="96,80 96,432 232,256" fill="#0086F8" />
    <polygon points="96,80 324,198 232,256" fill="#00D362" />
    <polygon points="96,432 324,314 232,256" fill="#FF3847" />
    <polygon points="324,198 416,256 324,314 232,256" fill="#FFBE00" />
  </g>
`;

const bg = (rounded) =>
  `<rect x="0" y="0" width="512" height="512" rx="${rounded ? 112 : 0}" fill="#ffffff"/>`;

const svgOf = (content, rounded) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${bg(rounded)}${content}</svg>`;

const svgAny = svgOf(PLAY_LOGO_PATHS, true);
const svgFull = svgOf(PLAY_LOGO_PATHS, false);
const svgMask = svgOf(
  `<g transform="translate(51.2 51.2) scale(0.8)">${PLAY_LOGO_PATHS}</g>`,
  false
);

const render = (input, file, size) =>
  sharp(Buffer.from(input)).resize(size, size).png().toFile(file);

writeFileSync("public/icons/icon.svg", svgAny);
await render(svgAny, "public/icons/icon-192.png", 192);
await render(svgAny, "public/icons/icon-512.png", 512);
await render(svgMask, "public/icons/maskable-512.png", 512);
await render(svgFull, "public/icons/apple-touch-180.png", 180);

// Well-known paths Chrome / Vercel look for (so the gray "V" never appears).
await render(svgAny, "public/icon-192.png", 192);
await render(svgAny, "public/icon-512.png", 512);
await render(svgAny, "public/favicon.png", 32);
await render(svgAny, "src/app/icon.png", 32);
await render(svgFull, "src/app/apple-icon.png", 180);

// Real .ico (PNG packed in ICO container) so /favicon.ico isn't Vercel's default.
const png32 = await sharp(Buffer.from(svgAny)).resize(32, 32).png().toBuffer();
writeFileSync("public/favicon.ico", pngToIco(png32, 32, 32));
writeFileSync("src/app/favicon.ico", pngToIco(png32, 32, 32));

function pngToIco(png, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // ICO
  header.writeUInt16LE(1, 4); // 1 image
  const dir = Buffer.alloc(16);
  dir.writeUInt8(width >= 256 ? 0 : width, 0);
  dir.writeUInt8(height >= 256 ? 0 : height, 1);
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(22, 12);
  return Buffer.concat([header, dir, png]);
}

copyFileSync("public/icons/icon-192.png", "public/logo192.png");
copyFileSync("public/icons/icon-512.png", "public/logo512.png");

console.log("✅ Icons written to public/, public/icons/, and src/app/");

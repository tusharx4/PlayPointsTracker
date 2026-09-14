/**
 * Exact geometric Google Play Logo generator.
 * Standard Play Store geometry:
 * An equilateral rounded triangle base with three folding lines meeting at the centroid.
 * - Left point: (130, 95)
 * - Bottom point: (130, 417)
 * - Right tip: (408, 256)
 * - Centroid: (222, 256)
 * - Top-right fold intersection on right edge: (315, 202)
 * - Bottom-right fold intersection on right edge: (315, 310)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

mkdirSync("public/icons", { recursive: true });

const PLAY_LOGO_PATHS = `
  <!-- Clip path to round the triangle's 3 corners smoothly -->
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
    <!-- Blue: Left quadrant (96,90) to (96,422) to centroid (228, 256) -->
    <polygon points="96,80 96,432 232,256" fill="#0086F8" />

    <!-- Green: Top fold (96,80) to (324, 198) to (232, 256) -->
    <polygon points="96,80 324,198 232,256" fill="#00D362" />

    <!-- Red: Bottom fold (96,432) to (324, 314) to (232, 256) -->
    <polygon points="96,432 324,314 232,256" fill="#FF3847" />

    <!-- Yellow: Right tip (324,198) to (416, 256) to (324, 314) to (232, 256) -->
    <polygon points="324,198 416,256 324,314 232,256" fill="#FFBE00" />
  </g>
`;

const bgWhite = (rounded) =>
  `<rect x="0" y="0" width="512" height="512" rx="${rounded ? 112 : 0}" fill="#ffffff"/>`;

const svgOf = (content, rounded) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${bgWhite(rounded)}${content}</svg>`;

const svgAny = svgOf(PLAY_LOGO_PATHS, true); // Squircle with white bg
const svgFull = svgOf(PLAY_LOGO_PATHS, false);
const svgMask = svgOf(
  `<g transform="translate(51.2 51.2) scale(0.8)">${PLAY_LOGO_PATHS}</g>`,
  false
);

const render = (input, file, size) =>
  sharp(Buffer.from(input)).resize(size, size).png().toFile(`public/icons/${file}`);

writeFileSync("public/icons/icon.svg", svgAny);
await render(svgAny, "icon-192.png", 192);
await render(svgAny, "icon-512.png", 512);
await render(svgMask, "maskable-512.png", 512);
await render(svgFull, "apple-touch-180.png", 180);

console.log("✅ Pixel-perfect Play Store icons generated in public/icons/");

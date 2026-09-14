/** Verify the actual export, catching the path errors that cause blank Pages sites. */
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePagesBasePath } from "./pages-path.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "out");
const basePath = resolvePagesBasePath();
const scope = `${basePath}/`;
const origin = "https://example.github.io";
const appURL = `${origin}${scope}`;

assert.equal(resolvePagesBasePath({ GITHUB_REPOSITORY: "someone/play-points" }), "/play-points");
assert.equal(resolvePagesBasePath({ GITHUB_REPOSITORY: "someone/someone.github.io" }), "");
assert.equal(resolvePagesBasePath({ GITHUB_REPOSITORY: "someone/play-points", NEXT_PUBLIC_BASE_PATH: "" }), "");
assert.equal(resolvePagesBasePath({ NEXT_PUBLIC_BASE_PATH: "/My-App/" }), "/My-App");
assert.throws(() => resolvePagesBasePath({ NEXT_PUBLIC_BASE_PATH: "../unsafe" }));

await access(path.join(out, "index.html"));
await access(path.join(out, ".nojekyll"));
const html = await readFile(path.join(out, "index.html"), "utf8");
const references = [...html.matchAll(/\b(?:src|href)="([^"<>]+)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
let scripts = 0;
let styles = 0;

async function assertLocalFile(reference) {
  const url = new URL(reference, appURL);
  if (url.origin !== origin || !/\.(?:js|css|woff2?|png|svg|webmanifest)$/.test(url.pathname)) return;
  assert(url.pathname.startsWith(scope), `Asset escapes repository path: ${url.pathname}`);
  const relative = decodeURIComponent(url.pathname.slice(scope.length));
  await access(path.join(out, relative));
  if (relative.endsWith(".js")) scripts++;
  if (relative.endsWith(".css")) {
    styles++;
    const css = await readFile(path.join(out, relative), "utf8");
    assert(css.includes("#1a73e8") || css.includes("--acc"), "Application theme CSS is missing");
    // Catch Tailwind scanning an empty staging folder: the mobile/desktop rail
    // and card classes must actually be emitted, not just the CSS variables.
    assert(css.includes(".min-h-dvh") && css.includes(".rounded-full"), "Tailwind utilities were not generated");
    for (const match of css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)) {
      const font = new URL(match[1], url);
      if (font.origin === origin) await assertLocalFile(font.href);
    }
  }
}

for (const reference of references) await assertLocalFile(reference);
assert(scripts > 0, "No hydration JavaScript found in index.html");
assert(styles > 0, "No stylesheets found in index.html");
assert(references.includes(`${scope}manifest.webmanifest`), "Incorrect manifest link");
assert(references.includes(`${scope}icons/apple-touch-180.png`), "Incorrect Apple icon path");

const manifestURL = `${appURL}manifest.webmanifest`;
const manifest = JSON.parse(await readFile(path.join(out, "manifest.webmanifest"), "utf8"));
assert.equal(new URL(manifest.start_url, manifestURL).href, appURL);
assert.equal(new URL(manifest.scope, manifestURL).href, appURL);
assert.equal(manifest.display, "standalone");
assert(manifest.icons.some((icon) => icon.sizes === "192x192"));
assert(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
for (const icon of manifest.icons) await assertLocalFile(new URL(icon.src, manifestURL).href);

const worker = await readFile(path.join(out, "sw.js"), "utf8");
assert(worker.includes("self.registration.scope"), "Service worker must be scoped to this repository");
assert(!worker.includes("__PLAY_POINTS_BUILD__"), "Service worker build version was not replaced");
assert(!worker.includes('cache.addAll(["/"])'), "Service worker incorrectly caches the domain root");
for (const route of ["accounts", "history", "analytics", "settings"]) {
  const redirect = await readFile(path.join(out, route, "index.html"), "utf8");
  assert(redirect.includes("location.replace"), `Missing recovery redirect for ${route}`);
}
for (const secret of [".env", "server.js", "api/health/route.js"]) {
  await assert.rejects(access(path.join(out, secret)), `Unexpected server/secret file in export: ${secret}`);
}
console.log(`✓ Pages export verified at ${scope}: HTML, ${scripts} scripts, ${styles} stylesheets, fonts, route recovery and PWA assets.`);

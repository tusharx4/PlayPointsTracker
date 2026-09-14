/* Play Points Tracker: a repository-scoped, versioned offline app shell. */
const ROOT = new URL(self.registration.scope);
const CACHE_PREFIX = `playpoints:${ROOT.pathname}:`;
const CACHE = `${CACHE_PREFIX}__PLAY_POINTS_BUILD__`;
const assetURL = (file) => new URL(file, ROOT).href;

function localStaticURL(value, base = ROOT) {
  const url = new URL(value, base);
  return url.origin === ROOT.origin && url.pathname.startsWith(`${ROOT.pathname}_next/static/`)
    ? url.href
    : null;
}

async function precacheAsset(cache, url) {
  if (await cache.match(url)) return;
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`Cannot cache app asset: ${url}`);
  await cache.put(url, response.clone());
  // Fonts referenced from the generated CSS are needed on the first offline launch.
  if (new URL(url).pathname.endsWith(".css")) {
    const css = await response.text();
    const fonts = [...css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)]
      .map((match) => localStaticURL(match[1], url))
      .filter(Boolean);
    await Promise.all([...new Set(fonts)].map((font) => precacheAsset(cache, font)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(ROOT.href, { cache: "reload" });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      throw new Error("The app shell is not available; keeping the existing service worker.");
    }
    await cache.put(ROOT.href, response.clone());
    const html = await response.text();
    const scriptsAndStyles = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
      .map((match) => localStaticURL(match[1]))
      .filter(Boolean);
    const assets = [
      ...scriptsAndStyles,
      ...["manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-180.png"].map(assetURL),
    ];
    await Promise.all([...new Set(assets)].map((url) => precacheAsset(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) =>
      (key.startsWith(CACHE_PREFIX) && key !== CACHE) ||
      (ROOT.pathname === "/" && key === "ppt-v1")
    ).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheResponse(cache, key, response) {
  if (!response.ok) return;
  try {
    await cache.put(key, response.clone());
  } catch {
    // A full/disabled cache must never prevent a successful online response.
  }
}

async function navigate(request, url) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.status >= 500) throw new Error("Server unavailable");
    if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
      const isHome = url.pathname === ROOT.pathname || url.pathname === `${ROOT.pathname}index.html`;
      await cacheResponse(cache, isHome ? ROOT.href : request, response);
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(ROOT.href)) || new Response(
      "Open Play Points once while online, then try again.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}

async function loadAsset(request, immutable) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (immutable && cached) return cached;
  try {
    const response = await fetch(request);
    await cacheResponse(cache, request, response);
    return response;
  } catch {
    // Never return index.html for a missing JS/CSS asset: that causes a blank app.
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const relativePath = url.pathname.slice(ROOT.pathname.length);
  // Keep the real server health check, RSC payloads and SW updates out of caches.
  if (relativePath.startsWith("api/") || relativePath === "sw.js" || request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request, url));
  } else if (relativePath.startsWith("_next/static/")) {
    event.respondWith(loadAsset(request, true));
  } else if (relativePath.startsWith("icons/") || relativePath === "manifest.webmanifest") {
    event.respondWith(loadAsset(request, false));
  }
});

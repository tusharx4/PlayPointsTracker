/* Play Points Tracker — offline app shell. Works at the site root (e.g. Vercel). */
const VERSION = "v3";
const CACHE = `playpoints-${VERSION}`;
const ROOT = new URL(self.registration.scope);
const EXTRA = ["manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-180.png"];

const isBuildAsset = (url) =>
  url.origin === ROOT.origin && url.pathname.startsWith(`${ROOT.pathname}_next/static/`);

async function precache(cache, url) {
  if (await cache.match(url)) return;
  const res = await fetch(url, { cache: "reload" }).catch(() => null);
  if (!res || !res.ok) return;
  await cache.put(url, res.clone());
  if (new URL(url).pathname.endsWith(".css")) {
    // Fonts referenced by the CSS are needed for the first offline launch.
    const css = await res.text();
    const fonts = [...css.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)]
      .map((m) => new URL(m[1], url))
      .filter(isBuildAsset)
      .map((u) => u.href);
    await Promise.all([...new Set(fonts)].map((f) => precache(cache, f)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const res = await fetch(ROOT.href, { cache: "reload" });
    if (!res.ok) throw new Error("App shell unavailable");
    await cache.put(ROOT.href, res.clone());
    const html = await res.text();
    const assets = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
      .map((m) => new URL(m[1].replace(/&amp;/g, "&"), ROOT))
      .filter(isBuildAsset)
      .map((u) => u.href);
    const extra = EXTRA.map((f) => new URL(f, ROOT).href);
    await Promise.all([...new Set([...assets, ...extra])].map((u) => precache(cache, u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== CACHE && (k.startsWith("playpoints") || k.startsWith("ppt-")))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

async function put(cache, key, res) {
  if (!res.ok) return;
  try {
    await cache.put(key, res.clone());
  } catch {
    /* quota / disabled cache must never break a successful response */
  }
}

async function handleNavigate(request, url) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.status >= 500) throw new Error("server error");
    if (url.pathname === ROOT.pathname && (res.headers.get("content-type") || "").includes("text/html")) {
      await put(cache, ROOT.href, res);
    }
    return res;
  } catch {
    return (
      (await cache.match(ROOT.href)) ||
      new Response("Open Play Points once while online, then try again.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function handleAsset(request, cacheFirst) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cacheFirst && cached) return cached;
  try {
    const res = await fetch(request);
    await put(cache, request, res);
    return res;
  } catch {
    // Never answer a missing JS/CSS file with HTML — that causes a blank app.
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const rel = url.pathname.slice(ROOT.pathname.length);
  // Leave API calls, the worker itself and Next.js RSC payloads to the network.
  if (rel.startsWith("api/") || rel === "sw.js" || request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request, url));
  } else if (rel.startsWith("_next/static/")) {
    event.respondWith(handleAsset(request, true));
  } else if (rel.startsWith("icons/") || rel === "manifest.webmanifest") {
    event.respondWith(handleAsset(request, false));
  }
});

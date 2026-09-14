/**
 * Real-browser smoke test against a plain static server, not a Next.js server.
 * Run after build-pages.mjs with the same NEXT_PUBLIC_BASE_PATH.
 * One-time setup: npx playwright install chromium
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolvePagesBasePath } from "./pages-path.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "out");
const basePath = resolvePagesBasePath();
const scope = `${basePath}/`;
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (basePath && url.pathname === basePath) {
    res.writeHead(301, { Location: `${scope}${url.search}` }).end();
    return;
  }
  if (!url.pathname.startsWith(scope)) {
    res.writeHead(404).end("Outside this repository");
    return;
  }
  try {
    const relative = decodeURIComponent(url.pathname.slice(scope.length));
    let file = path.resolve(out, relative || "index.html");
    if (file !== out && !file.startsWith(`${out}${path.sep}`)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const content = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] ?? "application/octet-stream" }).end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(await readFile(path.join(out, "404.html")));
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const appURL = `http://127.0.0.1:${server.address().port}${scope}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "allow" });
  const page = await context.newPage();
  const runtimeErrors = [];
  const assetErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("response", (response) => {
    if (["script", "stylesheet"].includes(response.request().resourceType()) && response.status() >= 400) {
      assetErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  const heading = (name) => page.getByRole("heading", { name, exact: true }).waitFor({ timeout: 30000 });
  await page.goto(appURL, { waitUntil: "networkidle" });
  await heading("Overview");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 60000 });
  const scopePath = await page.evaluate(async () => new URL((await navigator.serviceWorker.ready).scope).pathname);
  assert.equal(scopePath, scope);
  assert.deepEqual(assetErrors, [], "Static JS/CSS URLs must not 404");

  const original = await page.evaluate(() => JSON.parse(localStorage.getItem("playpoints.data.v1")));
  assert(original.accounts.length > 0 && original.transactions.length > 0, "Demo data did not load");
  await page.getByRole("button", { name: "Accounts", exact: true }).click();
  await heading("Accounts & Balances");
  await page.getByRole("button", { name: "View history", exact: true }).first().click();
  await heading("Transaction History");
  assert.equal(await page.getByRole("combobox", { name: "Filter by account" }).inputValue(), original.accounts[0].id);
  await page.reload({ waitUntil: "networkidle" });
  await heading("Transaction History");

  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="number"]').fill("17");
  await dialog.locator("select").nth(1).selectOption("quest");
  await dialog.locator("textarea").fill("GitHub Pages browser smoke test");
  await dialog.getByRole("button", { name: "Add entry", exact: true }).click();
  await page.waitForFunction((count) => JSON.parse(localStorage.getItem("playpoints.data.v1")).transactions.length === count + 1, original.transactions.length);
  await page.reload({ waitUntil: "networkidle" });
  await heading("Transaction History");
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("playpoints.data.v1")));
  assert(persisted.transactions.some((t) => t.notes === "GitHub Pages browser smoke test" && t.category === "quest"));

  // Old clean URLs recover to the repository's canonical hash route, retaining filters.
  await page.goto(`${appURL}history?account=${encodeURIComponent(original.accounts[0].id)}`);
  await heading("Transaction History");
  assert.equal(new URL(page.url()).hash, `#/history?account=${original.accounts[0].id}`);

  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await heading("Analytics");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await heading("Overview");
  // The event arrives on Home, then must remain usable when Settings mounts.
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: async () => {} },
      userChoice: { value: Promise.resolve({ outcome: "dismissed", platform: "web" }) },
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await heading("Settings");
  await page.getByRole("button", { name: "Install", exact: true }).click();
  await page.getByText("Add to Home screen", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await heading("Settings");
  assert(await page.locator("html").evaluate((el) => el.classList.contains("dark")), "Theme did not persist");

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await heading("Settings");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await heading("Overview");
  assert.deepEqual(runtimeErrors, [], "Uncaught browser errors");
  await context.setOffline(false);
  await mkdir(path.join(root, "test-results"), { recursive: true });
  await page.screenshot({ path: path.join(root, "test-results/pages-desktop.png"), fullPage: true });
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(appURL);
  await mobilePage.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await mobilePage.getByRole("button", { name: "Accounts", exact: true }).click();
  await mobilePage.getByRole("heading", { name: "Accounts & Balances", exact: true }).waitFor();
  await mobilePage.screenshot({ path: path.join(root, "test-results/pages-mobile.png"), fullPage: true });
  await mobile.close();

  // Restrictive browsers must still get past the splash if localStorage is denied.
  const restricted = await browser.newContext({ serviceWorkers: "block" });
  await restricted.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  const restrictedPage = await restricted.newPage();
  await restrictedPage.goto(appURL);
  await restrictedPage.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await restricted.close();
  console.log(`✓ Browser smoke passed at ${scope}: desktop/mobile load, routes, filters, entry persistence, install prompt retention, offline reload and blocked-storage startup.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

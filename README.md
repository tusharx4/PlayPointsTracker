# Play Points Tracker

A Google Material You-style tracker for Google Play Points across Gmail accounts. Built with Next.js App Router, React, React Router v6, Tailwind CSS, Recharts and Lucide. Includes a Chrome-installable PWA.

**Points and account data stay in browser localStorage.** The app is independently developed and is not an official Google product.

## GitHub থেকে live করবেন যেভাবে

> GitHub Pages-এ Next.js source বা `.next/` folder সরাসরি চালানো যায় না। Pages শুধু static HTML/CSS/JS serve করে। এই repository-তে সেই static build ও automatic deployment workflow দেওয়া আছে।

1. Updated project-এর **সব source files**, `package.json`, lockfile থাকলে `package-lock.json`, `scripts/`, `public/`, এবং **`.github/workflows/deploy-pages.yml`** repository-তে push করুন। ZIP upload নয়—ZIP extract করে files দিন। Hidden `.github` folder যেন বাদ না যায়।
2. GitHub repository → **Settings → Pages → Build and deployment → Source → GitHub Actions** নির্বাচন করুন। **Deploy from a branch** নির্বাচন করবেন না।
3. Repository → **Actions → Deploy Play Points to GitHub Pages → Run workflow** চালান। পরের default-branch push-এ স্বয়ংক্রিয়ভাবে deploy হবে।
4. `build` ও `deploy` job সবুজ হলে **Settings → Pages → Visit site**, অথবা deployment-এর URL খুলুন।
5. সাধারণ project URL: `https://USERNAME.github.io/REPOSITORY/`। Accounts-এর সরাসরি URL: `https://USERNAME.github.io/REPOSITORY/#/accounts`।

**Repository name code-এ বসাতে হবে না।** Workflow GitHub Pages-এর `base_path` থেকে JavaScript, CSS, fonts, icons এবং service worker-এর path সেট করে। `USERNAME.github.io` root repositories এবং Pages-এ configured custom domains-ও সমর্থিত। Domain পরিবর্তনের পরে workflow আবার চালান।

### আগে live করে না খুললে

- শুধু source upload বা branch-based publishing-এ অ্যাপ চলবে না; উপরের **GitHub Actions** source নির্বাচন করুন।
- **Actions → failed run → failed step** দেখুন। “Get Pages site failed / Not Found” হলে আগে Settings → Pages-এ Source ঠিক করে workflow পুনরায় চালান।
- CSS/JS 404 বা blank screen হলে default branch-এ নতুন workflow/config আছে এবং সর্বশেষ deployment সফল হয়েছে কি না দেখুন। `.next/` নয়, workflow-generated **`out/`** deploy হবে।
- পুরোনো cache এলে প্রথমে Chrome-এ **hard refresh** (`Ctrl+Shift+R`) করুন অথবা Incognito-তে URL পরীক্ষা করুন।
- তবুও পুরোনো version থাকলে DevTools → Application → Service Workers থেকে শুধু এই অ্যাপের worker **Unregister** করে reload করুন। **Clear site data / localStorage মুছবেন না**—তাতে আপনার points data হারাবে। আগে Settings থেকে JSON backup নিন।
- এই sandbox থেকে আপনার GitHub repository-এর settings বদলানো বা deployment run করা হয় না; উপরের কয়েকটি repository-side ধাপ একবার করতে হবে।

## Local development / Node hosting

Use **Node.js 22 LTS**.

```bash
npm install
npm run dev
```

For a Node host (e.g. Vercel or a server):

```bash
npm run build
npm start
```

The normal build retains `/api/health`, which checks PostgreSQL through Drizzle. Copy `.env.example` to `.env` and supply a reachable `DATABASE_URL` if the host requires this health endpoint. The tracking UI itself does not depend on the database. Never commit `.env`.

## Manual GitHub Pages / static build

```bash
# Project site at https://USERNAME.github.io/play-points/
NEXT_PUBLIC_BASE_PATH=/play-points node scripts/build-pages.mjs
NEXT_PUBLIC_BASE_PATH=/play-points node scripts/verify-pages.mjs
```

Root site or custom domain:

```bash
NEXT_PUBLIC_BASE_PATH= node scripts/build-pages.mjs
NEXT_PUBLIC_BASE_PATH= node scripts/verify-pages.mjs
```

Publish **the contents of `out/`**, never the source tree or `.next/`. This is a build-time path: changing the hosting folder requires a rebuild. GitHub Actions supplies it automatically. Do not run `next export`; modern Next.js uses `output: "export"`.

The Pages build runs in a disposable `.pages-build/` copy, excludes server-only API/DB modules, and removes the copy afterward. It never changes the real source or normal server build. No database, API server or `.env` is required on GitHub Pages. The export includes `.nojekyll` so `_next` files are served correctly.

## Install from Chrome

1. Open the **deployed HTTPS URL in a normal Chrome tab**, not an embedded preview.
2. Android: `⋮` → **Add to Home screen** → **Install** (wording varies by Chrome version).
3. Desktop: use the address-bar install icon, Chrome’s **Install app** menu, or **Settings → Install app** in the tracker when Chrome makes the prompt available.
4. The app opens in standalone mode with the four-color Play-style triangle icon.

Install prompts are controlled by Chrome and may not appear in Incognito, unsupported browsers or when the app is already installed. Safari/iOS uses Share → Add to Home Screen.

Manifest URLs are relative to the repository. The service worker registers only inside that repository's scope; it does not intercept sibling Pages sites or the server API. Each Pages build has a versioned app-shell cache. After one successful online visit, the cached shell, JS/CSS and fonts allow offline use. Missing JS is never replaced with HTML.

## Features

- Overview: balance, weekly earned/spent, period/account filters, charts and recent activity.
- Accounts: colored profiles, lifetime totals, last activity and filtered-history links.
- History: search, account/category/date-range filters, sorting, editing, deletion and undo.
- Analytics: weekly, account and category breakdowns.
- Manual entries: weekly rewards, quests, purchases, special offers, coupons and other bonuses.
- Settings: light/dark appearance, CSV/JSON backup/restore, demo data, local reset and installation.

Routes use **HashRouter**: `/#/accounts`, `/#/history`, `/#/analytics`, `/#/settings`, prefixed by the repository on project sites. Refreshing a hash route does not require server rewrites. The export also recovers older clean page links while preserving query filters.

## Validation

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

Static export verification checks HTML, every referenced JS/CSS/font file, PWA icons/URLs, `.nojekyll`, route recovery and that secrets/server files are not published.

For a real Chromium smoke test after an export (use the same base path):

```bash
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/play-points node scripts/smoke-pages.mjs
```

The smoke test temporarily serves **only static files**, checks desktop/mobile loading, navigation, account filters, entry persistence, install-event handling, offline reload and startup with blocked storage. It closes its server/browser when finished and never touches your real browser data.

## Source layout

```text
.github/workflows/deploy-pages.yml  Build, verify and deploy GitHub Pages
next.config.ts                     Separate Node vs static-export settings
public/manifest.webmanifest         Repository-relative PWA manifest
public/sw.js                       Scoped offline worker
public/icons/                      Generated Play-style app icons
public/.nojekyll                    Disable Jekyll file filtering
scripts/build-pages.mjs             Safe isolated static export
scripts/pages-path.mjs              Root/repository/custom-domain path resolver
scripts/verify-pages.mjs            Deployment artifact verification
scripts/smoke-pages.mjs             Static-host browser smoke tests
scripts/generate-icons.mjs          Regenerate icons with Sharp
src/app/                           Next entry point, metadata, theme, server health
src/routes/                        Dashboard, Accounts, History, Analytics, Settings
src/components/                    Navigation, charts, forms, reusable UI
src/lib/deployment.ts               Shared public asset paths
src/lib/pwa.tsx                     Global install-event handling and SW registration
src/lib/store.tsx                   App state and safe storage hydration
src/lib/data.ts                     Persistence, sample data, CSV/JSON I/O
src/db/                            Optional PostgreSQL/Drizzle server modules
```

## Data safety

- Storage key: `playpoints.data.v1`. Export JSON for a full accounts + entries backup.
- Moving between domains/browsers changes the localStorage origin; import your backup on the new site.
- Browser storage is shared by sites on the same origin, including GitHub Pages repositories under the same username. Keep regular backups.
- Service-worker updates never clear localStorage. Clearing browser site data does.
- Do not commit `.env`, private account exports, `node_modules`, `.next` or `out`.

# Play Points Tracker

A Material You (Material Design 3) web app for tracking **Google Play Points** across multiple Gmail accounts — weekly claims, Play Pass quest rewards, in-app purchase bonuses, special offers and redemptions, all in one dashboard.

Built with **Next.js (App Router) + React 19 + React Router v6 + Tailwind CSS v4 + Recharts + Lucide**. Runs as a **PWA**: install it from Chrome to your Home screen / desktop.

> All data is stored **locally in your browser** (localStorage). Nothing is sent to a server.

## Features

- **Dashboard (`/`)** — combined balance, earned & spent for the selected week/month, weekly earned-vs-spent chart, per-account balance donut, recent activity
- **Accounts (`/accounts`)** — one polished card per Gmail account: avatar, available balance, lifetime earned/spent, last activity, deep-link to that account's history
- **History (`/history`)** — search, filter by account / category / **date range**, 6 sort modes, quick edit & delete with undo
- **Analytics (`/analytics`)** — all-time KPIs, 12-week distribution, account breakdown, category-wise earning & spending
- **Settings (`/settings`)** — light/dark theme, account management, **export/import JSON + CSV backups**, sample data, clear-all
- **Entry modal** — account, Earned (+) / Spent (−), category (Weekly Claim, Quest Points / Play Pass, App / In-App Purchase, Special Offer / Multiplier, Coupon / Gift Card Redeem, Level Bonus / Other), amount, date, notes
- **PWA** — web app manifest, generated icons, service worker, "Install app" inside Settings

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

### Install as an app (Chrome)

1. Open the app over **HTTPS** (or localhost).
2. Click the **install icon** in the address bar, or `⋮` menu → **Cast, save & share → Install app**, or use **Add to Home screen** on Android.
3. Or use the **Install app** row inside **Settings**.

The app opens in standalone mode with its own icon (official 4-color Google Play Store triangle).

### Regenerating icons

Icons are generated from a single SVG source:

```bash
node scripts/generate-icons.mjs
```

## Data & privacy

- Stored in `localStorage` under `playpoints.data.v1` — per device, per browser.
- **Export JSON** = full backup (accounts + entries). **Import JSON** restores it.
- **Export CSV** = spreadsheet-friendly transactions table. **Import CSV** merges entries matched by account email.
- First run is seeded with demo data so the UI is visible immediately; load fresh sample data or clear everything from Settings.

## Project structure

```
public/
  manifest.webmanifest      PWA manifest
  sw.js                     service worker (network-first + cache)
  icons/                    generated app icons (icon.svg is the source)
scripts/
  generate-icons.mjs        builds all PNG icons from the SVG source
src/
  app/                      Next.js app router (layout, page, globals.css, /api/health)
  lib/
    types.ts                domain model + categories + palette
    dates.ts                ISO-week engine & period filters
    data.ts                 localStorage, sample data, CSV/JSON I/O
    store.tsx               global store (data, theme, toasts, confirms)
  components/
    ui/                     M3 kit: buttons (ripple), cards, chips, fields, dialogs
    Shell.tsx               router shell: side rail (desktop), bottom nav (mobile), FAB
    charts.tsx              Recharts: weekly bars, balance donut, category bars
    TransactionModal.tsx    manual entry / edit
    AccountModal.tsx        add / edit Gmail account
    TransactionHistory.tsx  filterable history list
    FiltersBar.tsx, SummaryCards.tsx
  routes/                   page components
    DashboardPage.tsx       /
    AccountsPage.tsx        /accounts
    HistoryPage.tsx         /history
    AnalyticsPage.tsx       /analytics
    SettingsPage.tsx        /settings
```

## Tech notes

- **Tailwind v4** design tokens live in `src/app/globals.css` (`@theme inline` maps Google-flavored CSS variables — `--acc`, `--green`, `--gold`, `--red` — to Tailwind utilities; `.dark` switches to the `#121212` palette).
- Routing uses **HashRouter** so every page deep-link works on any static host without server rewrites.
- The service worker is registered in production only, so `npm run dev` stays cache-free.

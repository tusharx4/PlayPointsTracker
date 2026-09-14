# Play Points Tracker

Google Material You–style tracker for **Google Play Points** across multiple Gmail accounts.
Next.js + React Router + Tailwind CSS + Recharts. Installable as an app (PWA).

> All data is stored in your browser (localStorage). No database, no server setup, no environment variables needed.

## 🚀 Live করার নিয়ম (GitHub → Vercel, ২ মিনিট)

1. এই project-এর সব file GitHub-এ একটা repository-তে upload / push করুন
   (`node_modules`, `.next`, `.env` বাদ যাবে — `.gitignore` নিজেই বাদ দেয়)।
2. [vercel.com](https://vercel.com) → **Continue with GitHub** দিয়ে login → **Add New… → Project**।
3. আপনার repository-টা **Import** করুন।
4. কিছু বদলাতে হবে না — Framework `Next.js` automatically detect হবে, কোনো Environment Variable লাগবে না → **Deploy** চাপুন।
5. ১–২ মিনিটে `https://<project-name>.vercel.app` live হয়ে যাবে।
   এরপর GitHub-এ যেকোনো push করলেই Vercel নিজে থেকে আবার deploy করবে।

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> GitHub Pages-এ Next.js চলে না (ওটা শুধু static file host), তাই Vercel (free) ব্যবহার করুন।

## 📱 Phone / Desktop-এ Install (Add to Home screen)

- **Android Chrome:** live link খুলুন → `⋮` menu → **Add to Home screen** / **Install app**।
- **Desktop Chrome:** address bar-এর install icon, অথবা অ্যাপের **Settings → Install app**।
- **iPhone Safari:** Share → **Add to Home Screen**।

অ্যাপ standalone mode-এ Google Play-style icon সহ খুলবে, একবার online খোলার পর offline-ও কাজ করে।

## 💻 Local-এ চালাতে

```bash
npm install
npm run dev      # http://localhost:3000
```

## Features

- **Overview** — combined balance, weekly earned/spent, week/month + account filters, charts, recent activity
- **Accounts** — per-Gmail cards: balance, lifetime earned/spent, last activity, filtered history link
- **History** — search, account/category/date-range filters, sorting, edit/delete with undo
- **Analytics** — weekly, per-account and per-category breakdowns
- **Entry form** — Earned/Spent, categories (Weekly Claim, Quest Points / Play Pass, In-App Purchase, Special Offer, Coupon, Other), date, notes
- **Settings** — light/dark theme, JSON/CSV export & import, sample data, install app

## Data safety

- Storage key: `playpoints.data.v1` (per browser, per domain). Use **Settings → Export JSON** for backups.
- Moving to a new domain/browser? Import your JSON backup there.

## Project structure

```
public/            manifest, service worker, app icons
scripts/           generate-icons.mjs (regenerate icons: node scripts/generate-icons.mjs)
src/app/           Next.js entry (layout, page, not-found, globals.css, /api/health)
src/routes/        Dashboard, Accounts, History, Analytics, Settings pages
src/components/    navigation shell, charts, forms, UI kit
src/lib/           store, data/persistence, dates, PWA install hook
```

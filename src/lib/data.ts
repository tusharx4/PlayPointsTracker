import {
  ACCOUNT_COLORS,
  CATEGORIES,
  type Account,
  type AppData,
  type Category,
  type Tx,
} from "./types";
import { addDays, startOfWeek, toISODate, todayISO } from "./dates";

const STORAGE_KEY = "playpoints.data.v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/* ------------------------------ persistence ------------------------------ */

export function loadData(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

/** Coerce arbitrary JSON into a valid AppData shape (used for load + import). */
export function sanitizeData(input: unknown): AppData {
  const src = (input ?? {}) as Record<string, unknown>;

  const accounts: Account[] = Array.isArray(src.accounts)
    ? (src.accounts.map(cleanAccount).filter(Boolean) as Account[])
    : [];
  const ids = new Set(accounts.map((a) => a.id));

  const transactions: Tx[] = Array.isArray(src.transactions)
    ? (src.transactions
        .map(cleanTx)
        .filter(Boolean) as Tx[])
        .filter((t) => ids.has(t.accountId))
    : [];

  return { version: 1, accounts, transactions };
}

function cleanAccount(a: unknown): Account | null {
  if (!a || typeof a !== "object") return null;
  const x = a as Record<string, unknown>;
  const email = typeof x.email === "string" ? x.email.trim() : "";
  if (!email) return null;
  const name = typeof x.name === "string" && x.name.trim() ? x.name.trim() : email.split("@")[0];
  const color =
    typeof x.color === "string" && /^#[0-9a-fA-F]{6}$/.test(x.color)
      ? x.color
      : ACCOUNT_COLORS[Object.values(x).length % ACCOUNT_COLORS.length];
  return {
    id: typeof x.id === "string" && x.id ? x.id : uid(),
    name,
    email,
    color,
    createdAt: Number(x.createdAt) || Date.now(),
  };
}

/** Migrate legacy category ids from older app versions. */
const CAT_MIGRATION: Record<string, Category> = {
  weekly: "weekly",
  "app-purchase": "iap",
  "in-game": "iap",
  iap: "iap",
  quest: "quest",
  event: "event",
  coupon: "coupon",
  "level-bonus": "other",
  other: "other",
};

function cleanTx(t: unknown): Tx | null {
  if (!t || typeof t !== "object") return null;
  const x = t as Record<string, unknown>;
  const accountId = typeof x.accountId === "string" ? x.accountId : "";
  if (!accountId) return null;
  const amount = Math.abs(Math.round(Number(x.amount) || 0));
  if (!amount) return null;
  const category: Category =
    (typeof x.category === "string" &&
      CATEGORIES.some((c) => c.id === x.category) &&
      CAT_MIGRATION[x.category as string]) ||
    "other";
  const date = typeof x.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.date) ? x.date : todayISO();
  return {
    id: typeof x.id === "string" && x.id ? x.id : uid(),
    accountId,
    type: x.type === "spent" ? "spent" : "earned",
    amount,
    category,
    date,
    notes: typeof x.notes === "string" ? x.notes : "",
    createdAt: Number(x.createdAt) || Date.now(),
  };
}

/* ------------------------------- balances -------------------------------- */

export function accountBalance(transactions: Tx[], accountId: string): number {
  return transactions
    .filter((t) => t.accountId === accountId)
    .reduce((s, t) => s + (t.type === "earned" ? t.amount : -t.amount), 0);
}

/* ------------------------------ sample data ------------------------------ */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKLY_AMOUNTS = [35, 35, 70, 70, 140];
const IAP_NOTES = ["Purchase bonus — Genshin Impact", "Purchase bonus — Duolingo", "IAP bonus — Mobile Legends"];
const QUEST_NOTES = ["Play Pass weekly quest", "Daily mission quest reward", "Play Pass bonus claim"];
const EVENT_NOTES = ["Double points weekend ×2", "Summer multiplier event", "Special offer — 2× earn"];

export function sampleData(): AppData {
  const rng = mulberry32(20260214);
  const now = Date.now();
  const accounts: Account[] = [
    { id: uid(), name: "Alex Rivera", email: "alex.rivera@gmail.com", color: "#1a73e8", createdAt: now - 86400000 * 60 },
    { id: uid(), name: "Sam Chen", email: "sam.chen.dev@gmail.com", color: "#a142f4", createdAt: now - 86400000 * 45 },
    { id: uid(), name: "Priya Nair", email: "priya.nair@gmail.com", color: "#12b5cb", createdAt: now - 86400000 * 30 },
  ];

  const txs: Tx[] = [];
  let seq = 0;
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
  const push = (
    accountId: string,
    type: Tx["type"],
    amount: number,
    category: Category,
    date: Date,
    notes: string
  ) => {
    txs.push({
      id: uid(),
      accountId,
      type,
      amount,
      category,
      date: toISODate(date),
      notes,
      createdAt: now - seq++ * 1000,
    });
  };

  const today = new Date();
  const monday0 = startOfWeek(today);

  for (let w = 7; w >= 0; w--) {
    const monday = addDays(monday0, -7 * w);
    accounts.forEach((a) => {
      // weekly reward claim (always in the current week)
      if (rng() < 0.85 || w === 0) {
        push(a.id, "earned", WEEKLY_AMOUNTS[Math.floor(rng() * WEEKLY_AMOUNTS.length)], "weekly", monday, "Weekly reward claim");
      }
      // Play Pass quests
      if (rng() < 0.55) {
        push(a.id, "earned", 30 + Math.floor(rng() * 120), "quest", addDays(monday, 1 + Math.floor(rng() * 5)), pick(QUEST_NOTES));
      }
      // in-app purchase bonuses
      if (rng() < 0.5) {
        push(a.id, "earned", 5 + Math.floor(rng() * 180), "iap", addDays(monday, Math.floor(rng() * 6)), pick(IAP_NOTES));
      }
    });
    // multiplier / special offer events
    if (w % 4 === 2) {
      const a = accounts[Math.floor(rng() * accounts.length)];
      push(a.id, "earned", 200 + Math.floor(rng() * 400), "event", addDays(monday, 4), pick(EVENT_NOTES));
    }
    // coupon redemptions
    if (w % 3 === 1) {
      const a = accounts[Math.floor(rng() * accounts.length)];
      push(a.id, "spent", 250 + Math.floor(rng() * 8) * 150, "coupon", addDays(monday, 2 + Math.floor(rng() * 4)), "Redeemed for gift card");
    }
    // level-up bonuses
    if (w === 4 || w === 1) {
      const a = accounts[Math.floor(rng() * accounts.length)];
      push(a.id, "earned", 60 + Math.floor(rng() * 120), "other", addDays(monday, 3), "Reached Play Points level 25");
    }
  }

  txs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return { version: 1, accounts, transactions: txs };
}

/* ------------------------------- CSV / JSON ------------------------------ */

const CSV_HEADER = ["id", "accountId", "email", "type", "amount", "category", "date", "notes", "createdAt"];

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function exportCSV(data: AppData): string {
  const emailOf = (id: string) => data.accounts.find((a) => a.id === id)?.email ?? "";
  const rows = data.transactions.map((t) => [
    t.id,
    t.accountId,
    emailOf(t.accountId),
    t.type,
    String(t.amount),
    t.category,
    t.date,
    t.notes,
    String(t.createdAt),
  ]);
  return [CSV_HEADER, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Small, robust CSV parser (handles quoted fields, escaped quotes, CRLF). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Map CSV rows onto existing accounts (by accountId or email). */
export function csvToTransactions(text: string, accounts: Account[]): { txs: Tx[]; skipped: number } {
  const rows = parseCSV(text);
  if (!rows.length) return { txs: [], skipped: 0 };
  let start = 0;
  if (rows[0]?.[0]?.trim().toLowerCase() === "id") start = 1;

  const byId = new Map(accounts.map((a) => [a.id, a]));
  const byEmail = new Map(accounts.map((a) => [a.email.toLowerCase(), a]));

  const txs: Tx[] = [];
  let skipped = 0;

  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 6) {
      skipped++;
      continue;
    }
    const [id, accountId, email, type, amount, category, date, notes, createdAt] = r;
    const acc = (accountId && byId.get(accountId)) || (email && byEmail.get(email.trim().toLowerCase()));
    if (!acc) {
      skipped++;
      continue;
    }
    const amt = Math.abs(Math.round(Number(amount) || 0));
    if (!amt) {
      skipped++;
      continue;
    }
    txs.push({
      id: id && id.trim().length >= 8 ? id.trim() : uid(),
      accountId: acc.id,
      type: type === "spent" ? "spent" : "earned",
      amount: amt,
      category:
        (typeof category === "string" && CAT_MIGRATION[category]) || "other",
      date: typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO(),
      notes: typeof notes === "string" ? notes : "",
      createdAt: Number(createdAt) || Date.now(),
    });
  }
  return { txs, skipped };
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

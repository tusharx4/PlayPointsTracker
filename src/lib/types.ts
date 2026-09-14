export type TxType = "earned" | "spent";

export type Category =
  | "weekly"
  | "quest"
  | "iap"
  | "event"
  | "coupon"
  | "other";

export interface Account {
  id: string;
  name: string;
  email: string;
  color: string;
  createdAt: number;
}

export interface Tx {
  id: string;
  accountId: string;
  type: TxType;
  amount: number;
  category: Category;
  /** YYYY-MM-DD */
  date: string;
  notes: string;
  createdAt: number;
}

export interface AppData {
  version: 1;
  accounts: Account[];
  transactions: Tx[];
}

export const CATEGORIES: { id: Category; label: string; short: string }[] = [
  { id: "weekly", label: "Weekly Claim", short: "Weekly" },
  { id: "quest", label: "Quest Points / Play Pass", short: "Quests" },
  { id: "iap", label: "App / In-App Purchase", short: "IAP" },
  { id: "event", label: "Special Offer / Multiplier", short: "Offers" },
  { id: "coupon", label: "Coupon / Gift Card Redeem", short: "Coupons" },
  { id: "other", label: "Level Bonus / Other", short: "Other" },
];

export function categoryLabel(c: Category): string {
  return CATEGORIES.find((x) => x.id === c)?.label ?? "Other";
}

export function categoryShort(c: Category): string {
  return CATEGORIES.find((x) => x.id === c)?.short ?? "Other";
}

/** Google-flavored account palette */
export const ACCOUNT_COLORS = [
  "#1a73e8",
  "#a142f4",
  "#f4b400",
  "#ea4335",
  "#0f9d58",
  "#12b5cb",
  "#e8710a",
  "#c2185b",
];

/** Actions shared with pages through the router outlet. */
export interface ShellCtx {
  openAdd: () => void;
  openEdit: (t: Tx) => void;
  openAddAccount: () => void;
  openEditAccount: (a: Account) => void;
}

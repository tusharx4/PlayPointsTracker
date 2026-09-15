"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Account, AppData, Tx } from "./types";
import { csvToTransactions, loadData, sampleData, sanitizeData, saveData, uid } from "./data";

export type Theme = "dark" | "light";

export interface ToastState {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

const EMPTY: AppData = { version: 1, accounts: [], transactions: [] };

interface Store {
  ready: boolean;
  data: AppData;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  addAccount: (a: { name: string; email: string; color: string }) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  requestDeleteAccount: (a: Account) => Promise<boolean>;

  addTx: (t: Omit<Tx, "id" | "createdAt">) => void;
  updateTx: (t: Tx) => void;
  deleteTx: (id: string) => void;
  restoreTx: (t: Tx) => void;

  importJSON: (text: string) => string;
  importCSV: (text: string) => string;
  loadSample: () => void;
  clearAll: () => void;

  toast: ToastState | null;
  showToast: (message: string, action?: { label: string; onAction: () => void }) => void;
  dismissToast: () => void;

  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  confirmState: ConfirmState | null;
  resolveConfirm: (ok: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const toastTimer = useRef<number | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Hydrate from localStorage (seed sample data on first run)
  useEffect(() => {
    const t = (window.localStorage.getItem("playpoints.theme") as Theme) || "light";
    setTheme(t === "dark" ? "dark" : "light");
    setData(loadData() ?? sampleData());
    setReady(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (ready) saveData(data);
  }, [data, ready]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("playpoints.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const showToast = useCallback(
    (message: string, action?: { label: string; onAction: () => void }) => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      setToast({
        id: Date.now(),
        message,
        actionLabel: action?.label,
        onAction: action?.onAction,
      });
      toastTimer.current = window.setTimeout(() => setToast(null), 5200);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...opts, resolve });
      }),
    []
  );

  const resolveConfirm = useCallback(
    (ok: boolean) => {
      confirmState?.resolve(ok);
      setConfirmState(null);
    },
    [confirmState]
  );

  /* ------------------------------ actions -------------------------------- */

  const addAccount = useCallback((a: { name: string; email: string; color: string }) => {
    setData((d) => ({
      ...d,
      accounts: [...d.accounts, { ...a, id: uid(), createdAt: Date.now() }],
    }));
  }, []);

  const updateAccount = useCallback((a: Account) => {
    setData((d) => ({ ...d, accounts: d.accounts.map((x) => (x.id === a.id ? a : x)) }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      accounts: d.accounts.filter((x) => x.id !== id),
      transactions: d.transactions.filter((t) => t.accountId !== id),
    }));
  }, []);

  const addTx = useCallback((t: Omit<Tx, "id" | "createdAt">) => {
    setData((d) => ({
      ...d,
      transactions: [{ ...t, id: uid(), createdAt: Date.now() }, ...d.transactions],
    }));
  }, []);

  const updateTx = useCallback((t: Tx) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((x) => (x.id === t.id ? t : x)),
    }));
  }, []);

  const deleteTx = useCallback((id: string) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }, []);

  const restoreTx = useCallback((t: Tx) => {
    setData((d) => ({ ...d, transactions: [...d.transactions, t] }));
  }, []);

  const importJSON = useCallback((text: string): string => {
    try {
      const parsed = sanitizeData(JSON.parse(text));
      if (!parsed.accounts.length && !parsed.transactions.length) {
        return "That file doesn't contain any accounts or entries.";
      }
      setData(parsed);
      return `Imported ${parsed.accounts.length} accounts and ${parsed.transactions.length} entries.`;
    } catch {
      return "That file isn't a valid JSON backup.";
    }
  }, []);

  const importCSV = useCallback((text: string): string => {
    const { txs, skipped } = csvToTransactions(text, dataRef.current.accounts);
    if (!txs.length) return "No matching entries found in that CSV.";
    setData((d) => {
      const existing = new Set(d.transactions.map((t) => t.id));
      const fresh = txs.filter((t) => !existing.has(t.id));
      return { ...d, transactions: [...fresh, ...d.transactions] };
    });
    return `Imported ${txs.length} entries${skipped ? ` · ${skipped} skipped` : ""}.`;
  }, []);

  const loadSample = useCallback(() => setData(sampleData()), []);
  const clearAll = useCallback(() => setData(EMPTY), []);

  const requestDeleteAccount = useCallback(
    async (a: Account): Promise<boolean> => {
      const count = dataRef.current.transactions.filter((t) => t.accountId === a.id).length;
      const ok = await confirm({
        title: "Delete account?",
        message: count
          ? `This removes ${a.email} and its ${count} point ${count === 1 ? "entry" : "entries"}. This can't be undone.`
          : `This removes ${a.email}. This can't be undone.`,
        confirmLabel: "Delete",
        danger: true,
      });
      if (ok) {
        deleteAccount(a.id);
        showToast("Account deleted.");
      }
      return ok;
    },
    [confirm, deleteAccount, showToast]
  );

  const value: Store = {
    ready,
    data,
    theme,
    setTheme,
    toggleTheme,
    addAccount,
    updateAccount,
    deleteAccount,
    requestDeleteAccount,
    addTx,
    updateTx,
    deleteTx,
    restoreTx,
    importJSON,
    importCSV,
    loadSample,
    clearAll,
    toast,
    showToast,
    dismissToast,
    confirm,
    confirmState,
    resolveConfirm,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside AppProvider");
  return ctx;
}

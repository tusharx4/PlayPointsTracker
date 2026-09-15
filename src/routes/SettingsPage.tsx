"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Info,
  Moon,
  Pencil,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { ShellCtx } from "@/lib/types";
import { accountBalance, downloadFile, exportCSV, exportJSON, fmt } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, Button, Card, EmptyState, IconButton, PointValue } from "@/components/ui/kit";

function Row({
  icon,
  title,
  desc,
  action,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-t border-line/60 px-4 py-3.5 first:border-t-0 sm:px-5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger ? "bg-red-soft text-red" : "bg-acc-soft text-acc"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="text-[12px] leading-snug text-ink-soft">{desc}</p>
      </div>
      {action}
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function SettingsPage() {
  const { openAddAccount, openEditAccount } = useOutletContext<ShellCtx>();
  const store = useStore();
  const jsonRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const stamp = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const readFile = (file: File, cb: (text: string) => void) => {
    const r = new FileReader();
    r.onload = () => cb(String(r.result ?? ""));
    r.readAsText(file);
  };

  const handleJSONFile = (file: File) => {
    readFile(file, async (text) => {
      const ok = await store.confirm({
        title: "Restore backup?",
        message:
          "This replaces all current accounts and entries with the contents of the backup file. Consider exporting your current data first.",
        confirmLabel: "Restore",
      });
      if (ok) store.showToast(store.importJSON(text));
    });
  };

  const handleCSVFile = (file: File) => {
    readFile(file, (text) => store.showToast(store.importCSV(text)));
  };

  const loadSample = async () => {
    const hasData = store.data.accounts.length > 0 || store.data.transactions.length > 0;
    if (hasData) {
      const ok = await store.confirm({
        title: "Load sample data?",
        message: "This replaces your current accounts and entries with the demo dataset.",
        confirmLabel: "Load sample",
      });
      if (!ok) return;
    }
    store.loadSample();
    store.showToast("Sample data loaded.");
  };

  const clearAll = async () => {
    const ok = await store.confirm({
      title: "Clear all data?",
      message: "Every account and every entry will be permanently removed from this device.",
      confirmLabel: "Clear everything",
      danger: true,
    });
    if (ok) {
      store.clearAll();
      store.showToast("All data cleared.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* appearance */}
      <Card>
        <div className="px-4 pb-4 pt-5 sm:px-5">
          <h3 className="mb-3 text-[14px] font-semibold text-ink">Appearance</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => store.setTheme(t)}
                className={`rounded-[20px] border-2 p-2 text-left transition ${
                  store.theme === t ? "border-acc bg-acc/5" : "border-line hover:border-ink-soft/50"
                }`}
              >
                <div
                  className={`h-20 rounded-xl border border-line/70 p-2.5 ${
                    t === "dark" ? "bg-[#121212]" : "bg-[#f5f8fd]"
                  }`}
                >
                  <div
                    className="h-2.5 w-1/2 rounded-full"
                    style={{ backgroundColor: t === "dark" ? "#8ab4f8" : "#1a73e8" }}
                  />
                  <div
                    className="mt-1.5 h-2.5 w-3/4 rounded-full"
                    style={{ backgroundColor: t === "dark" ? "#3c4043" : "#dadce0" }}
                  />
                  <div
                    className="mt-3.5 h-7 rounded-lg border"
                    style={
                      t === "dark"
                        ? { backgroundColor: "#1b1d21", borderColor: "#2d2d2d" }
                        : { backgroundColor: "#fdfefe", borderColor: "#e4e8ef" }
                    }
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    {t === "light" ? <Sun size={14} /> : <Moon size={14} />}
                    {t === "light" ? "Light" : "Dark"}
                  </span>
                  {store.theme === t && <Check size={15} className="text-acc" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* install app (PWA) */}
      <Card>
        <div className="px-4 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-ink">Install app</h3>
        </div>
        {installed ? (
          <Row
            icon={<Check size={17} />}
            title="Installed on this device"
            desc="Play Points is running in standalone app mode."
            action={null}
          />
        ) : installEvt ? (
          <Row
            icon={<Download size={17} />}
            title="Install Play Points"
            desc="Pin the app to your Home screen or desktop from Chrome."
            action={
              <Button
                size="sm"
                onClick={() => {
                  void installEvt.prompt();
                  setInstallEvt(null);
                }}
              >
                Install
              </Button>
            }
          />
        ) : (
          <Row
            icon={<Info size={17} />}
            title="Add to Home screen"
            desc="In Chrome: open the ⋮ menu → Cast, save & share → Install app (or the install icon in the address bar)."
            action={null}
          />
        )}
      </Card>

      {/* accounts */}
      <Card>
        <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-ink">
            Mail accounts
            <span className="ml-2 rounded-full bg-acc-soft px-2 py-0.5 text-[11px] font-semibold text-acc-ink">
              {store.data.accounts.length}
            </span>
          </h3>
          <Button size="sm" variant="outlined" icon={<Plus size={14} />} onClick={openAddAccount}>
            Add
          </Button>
        </div>
        <div className="mt-2">
          {store.data.accounts.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title="No accounts yet"
              body="Add the Gmail accounts you earn Play Points on."
            />
          ) : (
            store.data.accounts.map((a) => {
              const bal = accountBalance(store.data.transactions, a.id);
              const count = store.data.transactions.filter(
                (t) => t.accountId === a.id
              ).length;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 border-t border-line/60 px-4 py-3 sm:px-5"
                >
                  <Avatar name={a.name} color={a.color} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{a.name}</p>
                    <p className="truncate text-[12.5px] text-ink-soft">{a.email}</p>
                  </div>
                  <div className="mr-1 text-right">
                    <PointValue value={bal} className="text-[13.5px]" />
                    <p className="text-[11px] text-ink-soft">
                      {count} {count === 1 ? "entry" : "entries"}
                    </p>
                  </div>
                  <IconButton label={`Edit ${a.email}`} onClick={() => openEditAccount(a)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label={`Delete ${a.email}`} className="hover:text-red" onClick={() => store.requestDeleteAccount(a)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* data */}
      <Card>
        <div className="px-4 pt-4 sm:px-5">
          <h3 className="text-[14px] font-semibold text-ink">Data & backup</h3>
        </div>
        <Row
          icon={<Download size={17} />}
          title="Export JSON backup"
          desc="Full backup — accounts and every entry"
          action={
            <Button
              size="sm"
              variant="tonal"
              onClick={() =>
                downloadFile(
                  `play-points-backup-${stamp()}.json`,
                  exportJSON(store.data),
                  "application/json"
                )
              }
            >
              Export
            </Button>
          }
        />
        <Row
          icon={<Download size={17} />}
          title="Export CSV"
          desc="Transactions table for spreadsheets"
          action={
            <Button
              size="sm"
              variant="tonal"
              onClick={() =>
                downloadFile(
                  `play-points-transactions-${stamp()}.csv`,
                  exportCSV(store.data),
                  "text/csv"
                )
              }
            >
              Export
            </Button>
          }
        />
        <Row
          icon={<Upload size={17} />}
          title="Import JSON backup"
          desc="Restores a backup file (replaces current data)"
          action={
            <Button size="sm" variant="tonal" onClick={() => jsonRef.current?.click()}>
              Import
            </Button>
          }
        />
        <Row
          icon={<Upload size={17} />}
          title="Import CSV"
          desc="Merges transactions, matched by account email"
          action={
            <Button size="sm" variant="tonal" onClick={() => csvRef.current?.click()}>
              Import
            </Button>
          }
        />
        <Row
          icon={<Sparkles size={17} />}
          title="Load sample data"
          desc="Fills the app with a demo dataset"
          action={
            <Button size="sm" variant="outlined" onClick={loadSample}>
              Load
            </Button>
          }
        />
        <Row
          danger
          icon={<Trash2 size={17} />}
          title="Clear all data"
          desc="Permanently removes accounts and entries from this device"
          action={
            <Button size="sm" variant="danger" onClick={clearAll}>
              Clear
            </Button>
          }
        />
        <input
          ref={jsonRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleJSONFile(f);
            e.target.value = "";
          }}
        />
        <input
          ref={csvRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleCSVFile(f);
            e.target.value = "";
          }}
        />
      </Card>

      {/* about */}
      <Card className="px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acc-soft text-acc">
            <Check size={17} />
          </span>
          <div>
            <p className="text-[13.5px] font-medium text-ink">Local-only storage</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
              Your data never leaves this device — it lives in your browser's local storage.
              Export a JSON backup regularly to keep a copy.{" "}
              <span className="tabular-nums">
                {fmt(store.data.transactions.length)} entries stored.
              </span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

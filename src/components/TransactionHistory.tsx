"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORIES, categoryLabel, type Category, type Tx } from "@/lib/types";
import { fmt } from "@/lib/data";
import { fmtDate, relativeLabel, todayISO } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Button, Card, CategoryIcon, EmptyState, IconButton, PointValue } from "./ui/kit";
import { Select } from "./ui/fields";

type SortId =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "account-asc"
  | "account-desc";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "date-desc", label: "Newest first" },
  { id: "date-asc", label: "Oldest first" },
  { id: "amount-desc", label: "Highest points" },
  { id: "amount-asc", label: "Lowest points" },
  { id: "account-asc", label: "Account A–Z" },
  { id: "account-desc", label: "Account Z–A" },
];

const FLIP: Record<SortId, SortId> = {
  "date-desc": "date-asc",
  "date-asc": "date-desc",
  "amount-desc": "amount-asc",
  "amount-asc": "amount-desc",
  "account-asc": "account-desc",
  "account-desc": "account-asc",
};

const dateInputCls =
  "h-10 rounded-full border border-line bg-card px-3 text-[12.5px] font-medium text-ink outline-none transition focus:border-acc focus:ring-2 focus:ring-acc/20";

export function TransactionHistory({
  onEdit,
  onAdd,
  initialAccount = "all",
}: {
  onEdit: (t: Tx) => void;
  onAdd: () => void;
  initialAccount?: string;
}) {
  const { data, deleteTx, restoreTx, confirm, showToast } = useStore();
  const [q, setQ] = useState("");
  const [acct, setAcct] = useState(initialAccount);
  const [cat, setCat] = useState<"all" | Category>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortId>("date-desc");

  const accts = useMemo(
    () => new Map(data.accounts.map((a) => [a.id, a] as const)),
    [data.accounts]
  );

  const hasFilters = q !== "" || acct !== "all" || cat !== "all" || from !== "" || to !== "";

  const list = useMemo(() => {
    let rows = data.transactions.filter((t) => accts.has(t.accountId));
    if (acct !== "all") rows = rows.filter((t) => t.accountId === acct);
    if (cat !== "all") rows = rows.filter((t) => t.category === cat);
    if (from) rows = rows.filter((t) => t.date >= from);
    if (to) rows = rows.filter((t) => t.date <= to);
    const s = q.trim().toLowerCase();
    if (s) {
      rows = rows.filter((t) => {
        const a = accts.get(t.accountId);
        return (
          t.notes.toLowerCase().includes(s) ||
          categoryLabel(t.category).toLowerCase().includes(s) ||
          (a?.email ?? "").toLowerCase().includes(s) ||
          (a?.name ?? "").toLowerCase().includes(s)
        );
      });
    }
    const key = sort.split("-")[0];
    const dir = sort.endsWith("asc") ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (key === "amount") return (a.amount - b.amount) * dir;
      if (key === "account")
        return (accts.get(a.accountId)?.email ?? "").localeCompare(
          accts.get(b.accountId)?.email ?? ""
        ) * dir;
      return (a.date.localeCompare(b.date) || a.createdAt - b.createdAt) * dir;
    });
  }, [data.transactions, accts, acct, cat, from, to, q, sort]);

  const clearFilters = () => {
    setQ("");
    setAcct("all");
    setCat("all");
    setFrom("");
    setTo("");
  };

  const remove = async (t: Tx) => {
    const a = accts.get(t.accountId);
    const ok = await confirm({
      title: "Delete entry?",
      message: `Delete this ${t.type === "earned" ? "earning" : "redemption"} of ${fmt(
        t.amount
      )} pts on ${a?.email ?? "this account"}? You can undo right after.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) {
      deleteTx(t.id);
      showToast("Entry deleted.", { label: "Undo", onAction: () => restoreTx(t) });
    }
  };

  const headerBtn = (id: SortId, label: string, extra = "") => (
    <button
      onClick={() => setSort((s) => (s === id ? FLIP[id] : id))}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-ink/6 ${
        sort === id || sort === FLIP[id] ? "text-acc" : "text-ink-soft"
      } ${extra}`}
    >
      {label}
      {sort === id ? (
        id.endsWith("asc") ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )
      ) : (
        <ArrowUpDown size={12} className="opacity-50" />
      )}
    </button>
  );

  if (data.accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox size={24} />}
          title="No entries yet"
          body="Once you add a mail account, your Play Points history will show up here."
          action={
            <Button onClick={onAdd}>
              <Pencil size={15} />
              Add your first entry
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* advanced filter toolbar */}
      <Card className="space-y-2.5 p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes, categories, accounts…"
              className="h-10 w-full rounded-full border border-line bg-card-2/70 pl-10 pr-4 text-[13.5px] text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-acc focus:bg-card focus:ring-2 focus:ring-acc/20"
            />
          </div>
          <Button
            size="sm"
            variant="text"
            icon={<X size={14} />}
            onClick={clearFilters}
            className={hasFilters ? "" : "pointer-events-none opacity-40"}
          >
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Select aria-label="Filter by account" value={acct} onChange={(e) => setAcct(e.target.value)}>
            <option value="all">All accounts</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by category"
            value={cat}
            onChange={(e) => setCat(e.target.value as "all" | Category)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label="From date"
              value={from}
              max={todayISO()}
              onChange={(e) => setFrom(e.target.value)}
              className={`${dateInputCls} w-full min-w-0`}
            />
            <span className="shrink-0 text-xs text-ink-soft">→</span>
            <input
              type="date"
              aria-label="To date"
              value={to}
              min={from || undefined}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
              className={`${dateInputCls} w-full min-w-0`}
            />
          </div>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortId)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <p className="px-1 text-[12px] text-ink-soft">
        Showing {list.length} of {data.transactions.length} entries
      </p>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={22} />}
            title="No matches"
            body="Try a different search term or clear the filters."
            action={
              <Button variant="tonal" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-card-2/60 text-[12px] font-medium text-ink-soft">
                  <th className="px-4 py-3 font-medium">{headerBtn("date-desc", "Date")}</th>
                  <th className="px-4 py-3 font-medium">{headerBtn("account-asc", "Account")}</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 text-right font-medium">{headerBtn("amount-desc", "Points")}</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => {
                  const a = accts.get(t.accountId);
                  const rel = relativeLabel(t.date);
                  return (
                    <tr key={t.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-ink/4">
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="text-[13px] font-medium text-ink">{rel}</span>
                        {rel !== fmtDate(t.date) && (
                          <span className="ml-1.5 text-[12px] text-ink-soft">{fmtDate(t.date)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: a?.color }}
                          />
                          <span className="max-w-[180px] truncate text-[13px] text-ink">{a?.email}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
                          <CategoryIcon category={t.category} box={24} size={13} />
                          {categoryLabel(t.category)}
                        </span>
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-[13px] text-ink-soft">
                        {t.notes || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <PointValue value={t.type === "earned" ? t.amount : -t.amount} className="text-[13.5px]" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <IconButton label="Edit entry" className="h-9 w-9" onClick={() => onEdit(t)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton label="Delete entry" className="h-9 w-9 hover:text-red" onClick={() => remove(t)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {list.map((t) => {
              const a = accts.get(t.accountId);
              return (
                <Card key={t.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <CategoryIcon category={t.category} box={36} size={17} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13.5px] font-semibold text-ink">
                          {categoryLabel(t.category)}
                        </p>
                        <PointValue
                          value={t.type === "earned" ? t.amount : -t.amount}
                          className="text-[14px]"
                        />
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink-soft">
                        {relativeLabel(t.date)} · {a?.email}
                      </p>
                      {t.notes && (
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-soft/80">{t.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="-mr-1 mt-1 flex justify-end gap-1">
                    <IconButton label="Edit entry" className="h-9 w-9" onClick={() => onEdit(t)}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label="Delete entry" className="h-9 w-9 hover:text-red" onClick={() => remove(t)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

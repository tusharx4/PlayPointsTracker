"use client";

import React, { useMemo } from "react";
import { ArrowRight, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { Account, ShellCtx, Tx } from "@/lib/types";
import { categoryLabel } from "@/lib/types";
import { accountBalance, fmt } from "@/lib/data";
import { relativeLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Avatar, Button, Card, EmptyState, IconButton } from "@/components/ui/kit";

function lastActivity(txs: Tx[]): { date: string; label: string } | null {
  if (!txs.length) return null;
  const latest = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0];
  return { date: latest.date, label: categoryLabel(latest.category) };
}

function AccountCard({ a }: { a: Account }) {
  const { data, requestDeleteAccount } = useStore();
  const { openEditAccount } = useOutletContext<ShellCtx>();
  const navigate = useNavigate();

  const txs = useMemo(
    () => data.transactions.filter((t) => t.accountId === a.id),
    [data.transactions, a.id]
  );
  const balance = accountBalance(data.transactions, a.id);
  const earned = txs.filter((t) => t.type === "earned").reduce((s, t) => s + t.amount, 0);
  const spent = txs.filter((t) => t.type === "spent").reduce((s, t) => s + t.amount, 0);
  const last = lastActivity(txs);

  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: a.color }} />
      <div className="flex items-center gap-3">
        <Avatar name={a.name} color={a.color} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{a.name}</p>
          <p className="truncate text-[12.5px] text-ink-soft">{a.email}</p>
        </div>
        <div className="flex">
          <IconButton label={`Edit ${a.email}`} className="h-9 w-9" onClick={() => openEditAccount(a)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton label={`Delete ${a.email}`} className="h-9 w-9 hover:text-red" onClick={() => requestDeleteAccount(a)}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-ink-soft">Available now</p>
          <p className="text-[28px] font-semibold leading-tight tracking-tight tabular-nums text-ink">
            {fmt(balance)}
            <span className="ml-1 text-[13px] font-medium text-ink-soft">pts</span>
          </p>
        </div>
        <Button
          variant="text"
          size="sm"
          onClick={() => navigate(`/history?account=${a.id}`)}
        >
          View history <ArrowRight size={14} />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-green-soft/70 px-3 py-2">
          <p className="text-[11px] font-medium text-ink-soft">Lifetime earned</p>
          <p className="text-[15px] font-semibold tabular-nums text-green">+{fmt(earned)}</p>
        </div>
        <div className="rounded-xl bg-red-soft/70 px-3 py-2">
          <p className="text-[11px] font-medium text-ink-soft">Lifetime spent</p>
          <p className="text-[15px] font-semibold tabular-nums text-red">−{fmt(spent)}</p>
        </div>
      </div>

      <p className="mt-3 border-t border-line/60 pt-2.5 text-[12px] text-ink-soft">
        {last ? (
          <>
            Last activity: <span className="font-medium text-ink">{relativeLabel(last.date)}</span>
            {" · "}
            {last.label}
          </>
        ) : (
          "No activity yet"
        )}
      </p>
    </Card>
  );
}

export default function AccountsPage() {
  const { openAddAccount } = useOutletContext<ShellCtx>();
  const { data } = useStore();
  const totalBalance = data.accounts.reduce((s, a) => s + accountBalance(data.transactions, a.id), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">{data.accounts.length}</span>{" "}
          {data.accounts.length === 1 ? "account" : "accounts"} ·{" "}
          <span className="font-semibold tabular-nums text-ink">{fmt(totalBalance)}</span> pts total
        </p>
        <Button icon={<Plus size={16} strokeWidth={2.5} />} onClick={openAddAccount}>
          Add Gmail account
        </Button>
      </div>

      {data.accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No mail accounts yet"
            body="Add the Gmail accounts you earn Play Points on, and each one gets its own balance card here."
            action={<Button onClick={openAddAccount}>Add your first account</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.accounts.map((a) => (
            <AccountCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

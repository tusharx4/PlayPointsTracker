"use client";

import React from "react";
import { Star, TrendingDown, TrendingUp } from "lucide-react";
import type { Account, Tx } from "@/lib/types";
import type { PeriodOption } from "@/lib/dates";
import { accountBalance, fmt } from "@/lib/data";
import { inPeriod } from "@/lib/dates";
import { Card } from "./ui/kit";

export function SummaryCards({
  accounts,
  txs,
  period,
}: {
  accounts: Account[];
  txs: Tx[];
  period: PeriodOption;
}) {
  const balances = accounts.map((a) => ({ a, bal: accountBalance(txs, a.id) }));
  const total = balances.reduce((s, x) => s + x.bal, 0);

  const periodTxs = txs.filter((t) => inPeriod(t.date, period.from, period.to));
  const earnedList = periodTxs.filter((t) => t.type === "earned");
  const spentList = periodTxs.filter((t) => t.type === "spent");
  const earnedTotal = earnedList.reduce((s, t) => s + t.amount, 0);
  const spentTotal = spentList.reduce((s, t) => s + t.amount, 0);

  const sub = period.label === "All Time" ? "All time" : period.label;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold">
            <Star size={20} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-ink-soft">Combined balance</p>
            <p className="text-[26px] font-semibold leading-tight tracking-tight text-ink tabular-nums">
              {total < 0 ? "−" : ""}
              {fmt(Math.abs(total))}
              <span className="ml-1 text-[13px] font-medium text-ink-soft">pts</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-line/60 pt-3">
          <span className="text-[12px] text-ink-soft">
            Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {balances.slice(0, 5).map(({ a, bal }) => (
              <span
                key={a.id}
                title={`${a.email} · ${fmt(bal)} pts`}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/10"
                style={{ backgroundColor: a.color }}
              />
            ))}
          </span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-soft text-green">
            <TrendingUp size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-ink-soft">Earned · {sub}</p>
            <p className="text-[26px] font-semibold leading-tight tracking-tight tabular-nums text-green">
              +{fmt(earnedTotal)}
              <span className="ml-1 text-[13px] font-medium text-ink-soft">pts</span>
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-line/60 pt-3 text-[12px] text-ink-soft">
          {earnedList.length} {earnedList.length === 1 ? "entry" : "entries"} in this period
        </p>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-soft text-red">
            <TrendingDown size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-ink-soft">Spent · {sub}</p>
            <p className="text-[26px] font-semibold leading-tight tracking-tight tabular-nums text-red">
              −{fmt(spentTotal)}
              <span className="ml-1 text-[13px] font-medium text-ink-soft">pts</span>
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-line/60 pt-3 text-[12px] text-ink-soft">
          {spentList.length} {spentList.length === 1 ? "redemption" : "redemptions"} in this period
        </p>
      </Card>
    </div>
  );
}

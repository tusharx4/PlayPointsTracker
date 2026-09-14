"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleUser,
  Layers,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ShellCtx } from "@/lib/types";
import { accountBalance, fmt } from "@/lib/data";
import { addDays, isoWeek, parseISO, startOfWeek } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/kit";
import { AccountChips } from "@/components/FiltersBar";
import { BalanceDonut, CategoryBars, WeeklyBars } from "@/components/charts";

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tone: "green" | "red" | "gold" | "acc";
  label: string;
  value: string;
  sub?: string;
}) {
  const tones = {
    green: "bg-green-soft text-green",
    red: "bg-red-soft text-red",
    gold: "bg-gold-soft text-gold",
    acc: "bg-acc-soft text-acc",
  } as const;
  return (
    <Card className="p-4">
      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="text-[20px] font-semibold tracking-tight tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-ink-soft">{sub}</p>}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data } = useStore();
  const [acct, setAcct] = useState("all");

  useEffect(() => {
    if (acct !== "all" && !data.accounts.some((a) => a.id === acct)) setAcct("all");
  }, [data.accounts, acct]);

  const accounts = useMemo(
    () => (acct === "all" ? data.accounts : data.accounts.filter((a) => a.id === acct)),
    [data.accounts, acct]
  );
  const txs = useMemo(
    () =>
      acct === "all" ? data.transactions : data.transactions.filter((t) => t.accountId === acct),
    [data.transactions, acct]
  );

  const stats = useMemo(() => {
    const earnedAll = txs.filter((t) => t.type === "earned").reduce((s, t) => s + t.amount, 0);
    const spentAll = txs.filter((t) => t.type === "spent").reduce((s, t) => s + t.amount, 0);
    // best earning week (last 12)
    const thisMonday = startOfWeek(new Date());
    let best = { week: 0, total: 0 };
    for (let i = 11; i >= 0; i--) {
      const from = addDays(thisMonday, -7 * i);
      const to = addDays(from, 6);
      let total = 0;
      for (const t of txs) {
        if (t.type !== "earned") continue;
        const d = parseISO(t.date).getTime();
        if (d >= from.getTime() && d <= to.getTime()) total += t.amount;
      }
      if (total > best.total) best = { week: isoWeek(from).week, total };
    }
    return { earnedAll, spentAll, net: earnedAll - spentAll, best };
  }, [txs]);

  const hasData = txs.length > 0;

  return (
    <div className="space-y-4">
      <AccountChips accounts={data.accounts} acct={acct} onAcct={setAcct} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp size={17} />}
          tone="green"
          label="All-time earned"
          value={`+${fmt(stats.earnedAll)}`}
        />
        <StatCard
          icon={<TrendingDown size={17} />}
          tone="red"
          label="All-time spent"
          value={`−${fmt(stats.spentAll)}`}
        />
        <StatCard
          icon={<Star size={17} />}
          tone="gold"
          label="Net points"
          value={`${stats.net < 0 ? "−" : ""}${fmt(Math.abs(stats.net))}`}
        />
        <StatCard
          icon={<BarChart3 size={17} />}
          tone="acc"
          label="Best earning week"
          value={stats.best.total ? `+${fmt(stats.best.total)}` : "—"}
          sub={stats.best.total ? `Week ${stats.best.week}` : "No data yet"}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-acc-soft text-acc">
            <BarChart3 size={17} />
          </span>
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Weekly distribution</h3>
            <p className="text-[12px] text-ink-soft">Earned vs spent per ISO week · last 12 weeks</p>
          </div>
        </div>
        <WeeklyBars txs={txs} weeks={12} />
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <CircleUser size={17} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Account breakdown</h3>
              <p className="text-[12px] text-ink-soft">Current balance per mail</p>
            </div>
          </div>
          <BalanceDonut accounts={accounts} txs={txs} />
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-soft text-green">
              <Layers size={17} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">By category</h3>
              <p className="text-[12px] text-ink-soft">Where points come from & go</p>
            </div>
          </div>
          {hasData ? (
            <CategoryBars txs={txs} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-[13px] text-ink-soft">
              Add entries to see category insights.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

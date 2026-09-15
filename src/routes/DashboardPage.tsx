"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CircleUser, Inbox, Plus } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { ShellCtx, Tx } from "@/lib/types";
import { categoryLabel } from "@/lib/types";
import { getPeriodOptions, relativeLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Button, Card, CategoryIcon, EmptyState, Logo, PointValue } from "@/components/ui/kit";
import { FiltersBar } from "@/components/FiltersBar";
import { SummaryCards } from "@/components/SummaryCards";
import { BalanceDonut, WeeklyBars } from "@/components/charts";

function RecentCard({ txs, onViewAll }: { txs: Tx[]; onViewAll: () => void }) {
  const { data } = useStore();
  const accts = useMemo(
    () => new Map(data.accounts.map((a) => [a.id, a] as const)),
    [data.accounts]
  );
  const recent = useMemo(
    () =>
      [...txs]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .slice(0, 6),
    [txs]
  );

  return (
    <Card>
      <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
        <h3 className="text-[14px] font-semibold text-ink">Recent activity</h3>
        <Button variant="text" size="sm" onClick={onViewAll}>
          View all
        </Button>
      </div>
      <ul className="pb-2">
        {recent.map((t) => (
          <li key={t.id} className="flex items-center gap-3 border-t border-line/50 px-4 py-2.5 sm:px-5">
            <CategoryIcon category={t.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-ink">
                {categoryLabel(t.category)}
                {t.notes && <span className="font-normal text-ink-soft"> · {t.notes}</span>}
              </p>
              <p className="truncate text-[12px] text-ink-soft">
                {relativeLabel(t.date)} · {accts.get(t.accountId)?.email}
              </p>
            </div>
            <PointValue
              value={t.type === "earned" ? t.amount : -t.amount}
              className="text-[13.5px]"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function DashboardPage() {
  const { openAdd, openAddAccount } = useOutletContext<ShellCtx>();
  const { data, loadSample } = useStore();
  const navigate = useNavigate();

  const options = useMemo(() => getPeriodOptions(), []);
  const [acct, setAcct] = useState("all");
  const [periodId, setPeriodId] = useState("week-cur");
  const period = options.find((o) => o.id === periodId) ?? options[0];

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

  if (data.accounts.length === 0) {
    return (
      <Card className="mx-auto max-w-xl">
        <div className="flex flex-col items-center px-6 pb-10 pt-12 text-center">
          <Logo size={64} />
          <h2 className="mt-5 text-xl font-semibold text-ink">Welcome to Play Points Tracker</h2>
          <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-soft">
            Track Google Play Points across every Gmail account — weekly claims, quest
            rewards, purchase bonuses and redemptions, all in one dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <Button onClick={openAddAccount}>Add your first account</Button>
            <Button variant="tonal" onClick={loadSample}>
              Load sample data
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FiltersBar
        accounts={data.accounts}
        acct={acct}
        onAcct={setAcct}
        period={period}
        options={options}
        onPeriod={setPeriodId}
      />
      <SummaryCards accounts={accounts} txs={txs} period={period} />
      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="p-4 sm:p-5 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-acc-soft text-acc">
              <BarChart3 size={17} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Weekly trend</h3>
              <p className="text-[12px] text-ink-soft">Earned vs spent · last 10 weeks</p>
            </div>
          </div>
          <WeeklyBars txs={txs} weeks={10} />
        </Card>
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <CircleUser size={17} />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Points by account</h3>
              <p className="text-[12px] text-ink-soft">Current balance per mail</p>
            </div>
          </div>
          <BalanceDonut accounts={accounts} txs={txs} />
        </Card>
      </div>
      {txs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus size={22} />}
            title="No entries in this view"
            body="Log your weekly claim or a quest reward to get the charts moving."
            action={<Button onClick={openAdd}>Add an entry</Button>}
          />
        </Card>
      ) : (
        <RecentCard txs={txs} onViewAll={() => navigate("/history")} />
      )}
    </div>
  );
}

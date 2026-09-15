"use client";

import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CircleUser } from "lucide-react";
import { CATEGORIES, type Account, type Tx } from "@/lib/types";
import { accountBalance, fmt } from "@/lib/data";
import { addDays, isoWeek, parseISO, startOfWeek } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { CATEGORY_META, EmptyState } from "./ui/kit";

export function useChartTheme() {
  const { theme } = useStore();
  const dark = theme === "dark";
  return {
    green: dark ? "#4cc38a" : "#0f9d58",
    red: dark ? "#f28b82" : "#ea4335",
    grid: dark ? "#2a2e35" : "#e4e8ef",
    tick: dark ? "#9aa0a6" : "#5f6368",
    cursor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
  };
}

function ChartTip({ active, payload, label, isWeek }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2.5 shadow-lg">
      <p className="mb-1 text-[11.5px] font-semibold text-ink">
        {isWeek ? `Week ${label}` : label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[12px] tabular-nums" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{fmt(p.value)} pts</span>
        </p>
      ))}
    </div>
  );
}

function weeklySeries(txs: Tx[], weeks: number) {
  const thisMonday = startOfWeek(new Date());
  const out: { label: string; earned: number; spent: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const from = addDays(thisMonday, -7 * i);
    const to = addDays(from, 6);
    const w = isoWeek(from);
    let earned = 0;
    let spent = 0;
    for (const t of txs) {
      const d = parseISO(t.date).getTime();
      if (d >= from.getTime() && d <= to.getTime()) {
        if (t.type === "earned") earned += t.amount;
        else spent += t.amount;
      }
    }
    out.push({ label: String(w.week), earned, spent });
  }
  return out;
}

/** Grouped bar chart: earned vs spent per ISO week. */
export function WeeklyBars({ txs, weeks = 10 }: { txs: Tx[]; weeks?: number }) {
  const c = useChartTheme();
  const series = useMemo(() => weeklySeries(txs, weeks), [txs, weeks]);
  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-[11.5px] font-medium text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.green }} />
          Earned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.red }} />
          Spent
        </span>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} barGap={3} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: c.tick }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => `W${v}`}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c.tick }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              width={44}
            />
            <Tooltip content={<ChartTip isWeek />} cursor={{ fill: c.cursor }} />
            <Bar dataKey="earned" name="Earned" fill={c.green} radius={[5, 5, 0, 0]} maxBarSize={20} />
            <Bar dataKey="spent" name="Spent" fill={c.red} radius={[5, 5, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donut of current balance per account with legend. */
export function BalanceDonut({ accounts, txs }: { accounts: Account[]; txs: Tx[] }) {
  const slices = useMemo(
    () =>
      accounts
        .map((a) => ({
          email: a.email,
          value: Math.max(0, accountBalance(txs, a.id)),
          color: a.color,
        }))
        .filter((s) => s.value > 0),
    [accounts, txs]
  );
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (slices.length === 0) {
    return (
      <EmptyState
        icon={<CircleUser size={24} />}
        title="Nothing to chart"
        body="Earn some points and a distribution chart will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="email"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={slices.length > 1 ? 3 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {slices.map((s) => (
                <Cell key={s.email} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-ink-soft">
            Total
          </span>
          <span className="text-lg font-semibold tabular-nums text-ink">{fmt(total)}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2.5">
        {slices.map((s) => (
          <li key={s.email} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{s.email}</span>
            <span className="text-[13px] font-semibold tabular-nums text-ink">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars: earned vs spent per category (all time for the filter). */
export function CategoryBars({ txs }: { txs: Tx[] }) {
  const c = useChartTheme();
  const data = useMemo(
    () =>
      CATEGORIES.map((cat) => {
        let earned = 0;
        let spent = 0;
        for (const t of txs) {
          if (t.category === cat.id) {
            if (t.type === "earned") earned += t.amount;
            else spent += t.amount;
          }
        }
        return { name: cat.short, earned, spent, color: CATEGORY_META[cat.id].color };
      }),
    [txs]
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-[11.5px] font-medium text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.green }} />
          Earned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.red }} />
          Spent
        </span>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barGap={2} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fontSize: 11.5, fill: c.tick }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTip />} cursor={{ fill: c.cursor }} />
            <Bar dataKey="earned" name="Earned" fill={c.green} radius={[0, 5, 5, 0]} maxBarSize={13} />
            <Bar dataKey="spent" name="Spent" fill={c.red} radius={[0, 5, 5, 0]} maxBarSize={13} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

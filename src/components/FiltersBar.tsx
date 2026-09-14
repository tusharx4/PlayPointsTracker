"use client";

import React from "react";
import { CalendarDays, ChevronDown, Users } from "lucide-react";
import type { Account } from "@/lib/types";
import type { PeriodOption } from "@/lib/dates";
import { Chip } from "./ui/kit";

export function AccountChips({
  accounts,
  acct,
  onAcct,
}: {
  accounts: Account[];
  acct: string;
  onAcct: (id: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
      <Chip
        selected={acct === "all"}
        icon={<Users size={14} />}
        label="All Accounts"
        onClick={() => onAcct("all")}
      />
      {accounts.map((a) => (
        <Chip
          key={a.id}
          selected={acct === a.id}
          onClick={() => onAcct(a.id)}
          icon={
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color }} />
          }
          label={a.name}
        />
      ))}
    </div>
  );
}

export function FiltersBar({
  accounts,
  acct,
  onAcct,
  period,
  options,
  onPeriod,
}: {
  accounts: Account[];
  acct: string;
  onAcct: (id: string) => void;
  period: PeriodOption;
  options: PeriodOption[];
  onPeriod: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <AccountChips accounts={accounts} acct={acct} onAcct={onAcct} />
      <div className="relative shrink-0">
        <CalendarDays
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
        />
        <select
          aria-label="Period filter"
          value={period.id}
          onChange={(e) => onPeriod(e.target.value)}
          className="h-10 min-w-[210px] cursor-pointer appearance-none rounded-full border border-line bg-card pl-9 pr-9 text-[13px] font-medium text-ink outline-none transition focus:border-acc focus:ring-2 focus:ring-acc/20"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} · {o.sub}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
        />
      </div>
    </div>
  );
}

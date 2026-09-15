export interface WeekRef {
  week: number;
  year: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Monday 00:00 of the week containing d */
export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** ISO-8601 week number + year */
export function isoWeek(d: Date): WeekRef {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const todayISO = () => toISODate(new Date());

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function relativeLabel(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = parseISO(iso);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  return fmtDate(iso);
}

export interface PeriodOption {
  id: string;
  label: string;
  sub: string;
  from: Date;
  to: Date;
}

/**
 * Week / month filter options. Specific weeks are labeled
 * like "Week 37" with the ISO year in `sub`, e.g. Week 37 · 2026.
 */
export function getPeriodOptions(now: Date = new Date()): PeriodOption[] {
  const opts: PeriodOption[] = [];
  const thisMonday = startOfWeek(now);
  const cur = isoWeek(now);

  opts.push({
    id: "week-cur",
    label: "This Week",
    sub: `Week ${cur.week} · ${cur.year}`,
    from: thisMonday,
    to: addDays(thisMonday, 6),
  });

  const prevMonday = addDays(thisMonday, -7);
  const prev = isoWeek(prevMonday);
  opts.push({
    id: "week-prev",
    label: "Last Week",
    sub: `Week ${prev.week} · ${prev.year}`,
    from: prevMonday,
    to: addDays(prevMonday, 6),
  });

  for (let i = 2; i <= 5; i++) {
    const m = addDays(thisMonday, -7 * i);
    const w = isoWeek(m);
    opts.push({
      id: `week-${w.week}-${w.year}`,
      label: `Week ${w.week}`,
      sub: `Week ${w.week} · ${w.year}`,
      from: m,
      to: addDays(m, 6),
    });
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  opts.push({
    id: "month-cur",
    label: "This Month",
    sub: MONTHS_FULL[now.getMonth()],
    from: monthStart,
    to: monthEnd,
  });

  const pmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  opts.push({
    id: "month-prev",
    label: "Last Month",
    sub: MONTHS_FULL[pmStart.getMonth()],
    from: pmStart,
    to: pmEnd,
  });

  opts.push({
    id: "all",
    label: "All Time",
    sub: "Everything",
    from: new Date(2000, 0, 1),
    to: new Date(2100, 0, 1),
  });

  return opts;
}

export function inPeriod(iso: string, from: Date, to: Date): boolean {
  const t = parseISO(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

"use client";

import React from "react";
import {
  CalendarCheck,
  Gamepad2,
  MoreHorizontal,
  Play,
  Sparkles,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { fmt } from "@/lib/data";

/* --------------------------------- ripple -------------------------------- */

export function useRipple() {
  return (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if ((el as HTMLButtonElement).disabled) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const span = document.createElement("span");
    span.className = "m3-ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 650);
  };
}

/* -------------------------------- buttons -------------------------------- */

type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "danger";

export function Button({
  variant = "filled",
  size = "md",
  icon,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}) {
  const ripple = useRipple();
  const sizes = size === "sm" ? "h-9 px-4 text-[13px]" : "h-11 px-5 text-sm";
  const variants: Record<ButtonVariant, string> = {
    filled: "bg-acc text-on-acc shadow-sm hover:shadow-md hover:brightness-105",
    tonal: "bg-acc-soft text-acc-ink hover:brightness-105 dark:hover:brightness-110",
    outlined: "border border-line text-acc hover:bg-acc/10",
    text: "text-acc hover:bg-acc/10",
    danger: "bg-red text-white hover:brightness-105",
  };
  return (
    <button
      className={`relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-medium transition duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc disabled:pointer-events-none disabled:opacity-40 ${sizes} ${variants[variant]} ${className}`}
      onPointerDown={ripple}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const ripple = useRipple();
  return (
    <button
      aria-label={label}
      title={label}
      className={`relative isolate inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-ink-soft transition hover:bg-ink/8 active:scale-95 focus-visible:outline-2 focus-visible:outline-acc ${className}`}
      onPointerDown={ripple}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Fab({
  label,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const ripple = useRipple();
  return (
    <button
      aria-label={label}
      title={label}
      className={`relative isolate inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-acc text-on-acc shadow-lg shadow-acc/30 transition hover:shadow-xl active:scale-95 ${className}`}
      onPointerDown={ripple}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------- surfaces ------------------------------- */

export function Card({
  className = "",
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`card-elev rounded-[20px] border border-line/70 bg-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const ripple = useRipple();
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={ripple}
      className={`relative isolate inline-flex h-9 shrink-0 select-none items-center gap-2 overflow-hidden rounded-full border px-3.5 text-[13px] font-medium transition ${
        selected
          ? "border-transparent bg-acc-soft text-acc-ink"
          : "border-line bg-card text-ink-soft hover:bg-ink/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* --------------------------------- avatar -------------------------------- */

export function Avatar({
  name,
  color,
  size = 36,
  className = "",
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

/* --------------------------------- points -------------------------------- */

export function PointValue({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const positive = value >= 0;
  return (
    <span
      className={`font-semibold tabular-nums ${positive ? "text-green" : "text-red"} ${className}`}
    >
      {positive ? "+" : "−"}
      {fmt(Math.abs(value))}
    </span>
  );
}

/* ------------------------------ category meta ---------------------------- */

export const CATEGORY_META: Record<Category, { icon: LucideIcon; color: string }> = {
  weekly: { icon: CalendarCheck, color: "#1a73e8" },
  quest: { icon: Sparkles, color: "#a142f4" },
  iap: { icon: Gamepad2, color: "#e8710a" },
  event: { icon: Zap, color: "#d39501" },
  coupon: { icon: Ticket, color: "#12b5cb" },
  other: { icon: MoreHorizontal, color: "#80868b" },
};

export function CategoryIcon({
  category,
  size = 15,
  box = 28,
}: {
  category: Category;
  size?: number;
  box?: number;
}) {
  const { icon: Icon, color } = CATEGORY_META[category];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: box, height: box, backgroundColor: `${color}1c`, color }}
    >
      <Icon size={size} />
    </span>
  );
}

/* ---------------------------------- logo --------------------------------- */

/**
 * Authentic Google Play Store 4-color folded triangle logo.
 * Geometry: blue base on left, green top flap, red bottom flap, yellow right tip.
 */
export function Logo({ size = 36, hasBg = false }: { size?: number; hasBg?: boolean }) {
  const clipId = React.useId();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${
        hasBg ? "rounded-2xl border border-line/60 bg-card p-1 shadow-sm" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width={hasBg ? size * 0.82 : size}
        height={hasBg ? size * 0.82 : size}
        aria-label="Google Play"
      >
        <defs>
          <clipPath id={clipId}>
            <path
              d="M 124 92
                 C 112 85 96 94 96 110
                 L 96 402
                 C 96 418 112 427 124 420
                 L 396 269
                 C 410 261 410 251 396 243
                 Z"
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {/* Blue: left triangle */}
          <polygon points="96,80 96,432 232,256" fill="#0086F8" />
          {/* Green: top flap */}
          <polygon points="96,80 324,198 232,256" fill="#00D362" />
          {/* Red: bottom flap */}
          <polygon points="96,432 324,314 232,256" fill="#FF3847" />
          {/* Yellow: right tip */}
          <polygon points="324,198 416,256 324,314 232,256" fill="#FFBE00" />
        </g>
      </svg>
    </span>
  );
}

/* ------------------------------- empty state ----------------------------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-acc-soft text-acc">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

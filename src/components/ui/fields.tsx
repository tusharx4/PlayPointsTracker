"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-soft">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-red">{error}</span>}
    </div>
  );
}

export const fieldCls =
  "h-11 w-full rounded-xl border border-line bg-card-2/70 px-3.5 text-[14px] text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-acc focus:bg-card focus:ring-2 focus:ring-acc/25";

export function TextInput({
  invalid,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={`${fieldCls} ${invalid ? "border-red/70 focus:border-red focus:ring-red/20" : ""} ${className}`}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className={`${fieldCls} appearance-none pr-9 ${invalid ? "border-red/70" : ""} cursor-pointer`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
      />
    </div>
  );
}

export function TextArea({
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-none rounded-xl border border-line bg-card-2/70 px-3.5 py-3 text-[14px] text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-acc focus:bg-card focus:ring-2 focus:ring-acc/25 ${className}`}
      {...rest}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; activeCls?: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-full border border-line bg-card-2/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`inline-flex h-9 flex-1 select-none items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition ${
            value === o.value
              ? o.activeCls ?? "bg-acc text-on-acc shadow-sm"
              : "text-ink-soft hover:bg-ink/5"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

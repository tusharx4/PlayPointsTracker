"use client";

import React, { useEffect, useRef, useState } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { CATEGORIES, type Category, type Tx, type TxType } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { Button, CATEGORY_META, EmptyState } from "./ui/kit";
import { Field, Segmented, Select, TextArea, TextInput } from "./ui/fields";
import { Modal } from "./ui/dialogs";

interface FormState {
  accountId: string;
  type: TxType;
  amount: string;
  category: Category;
  date: string;
  notes: string;
}

export function TransactionModal({
  open,
  editing,
  onClose,
  onAddAccount,
}: {
  open: boolean;
  editing: Tx | null;
  onClose: () => void;
  onAddAccount: () => void;
}) {
  const { data, addTx, updateTx, showToast } = useStore();
  const [form, setForm] = useState<FormState>({
    accountId: "",
    type: "earned",
    amount: "",
    category: "weekly",
    date: todayISO(),
    notes: "",
  });
  const [errors, setErrors] = useState<{ accountId?: string; amount?: string; date?: string }>({});
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setErrors({});
      if (editing) {
        setForm({
          accountId: editing.accountId,
          type: editing.type,
          amount: String(editing.amount),
          category: editing.category,
          date: editing.date,
          notes: editing.notes,
        });
      } else {
        setForm({
          accountId: data.accounts[0]?.id ?? "",
          type: "earned",
          amount: "",
          category: "weekly",
          date: todayISO(),
          notes: "",
        });
      }
    }
    wasOpen.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const errs: typeof errors = {};
    const amt = Math.round(Number(form.amount));
    if (!form.accountId) errs.accountId = "Pick a mail account.";
    if (!form.amount || Number.isNaN(amt) || amt <= 0)
      errs.amount = "Enter a positive number of points.";
    if (!form.date) errs.date = "Pick a date.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      accountId: form.accountId,
      type: form.type,
      amount: amt,
      category: form.category,
      date: form.date,
      notes: form.notes.trim(),
    };
    if (editing) {
      updateTx({ ...editing, ...payload });
      showToast("Entry updated.");
    } else {
      addTx(payload);
      const email = data.accounts.find((a) => a.id === form.accountId)?.email;
      showToast(`Added ${form.type === "earned" ? "to" : "from"} ${email ?? "account"}.`);
    }
    onClose();
  };

  const meta = CATEGORY_META[form.category];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit entry" : "Add points entry"}>
      {data.accounts.length === 0 ? (
        <EmptyState
          icon={<Star size={26} />}
          title="No mail accounts yet"
          body="You need at least one Google Mail account before you can track points for it."
          action={
            <Button variant="tonal" onClick={onAddAccount}>
              Add an account
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Field label="Mail account" error={errors.accountId}>
            <Select
              value={form.accountId}
              invalid={!!errors.accountId}
              onChange={(e) => set("accountId", e.target.value)}
            >
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Transaction type">
            <Segmented
              value={form.type}
              onChange={(v) => set("type", v)}
              options={[
                {
                  value: "earned",
                  activeCls: "bg-green-soft text-green shadow-sm",
                  label: (
                    <>
                      <Plus size={14} strokeWidth={2.75} /> Earned
                    </>
                  ),
                },
                {
                  value: "spent",
                  activeCls: "bg-red-soft text-red shadow-sm",
                  label: (
                    <>
                      <Minus size={14} strokeWidth={2.75} /> Spent
                    </>
                  ),
                },
              ]}
            />
          </Field>

          <Field label="Category / source">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line"
                style={{ backgroundColor: `${meta.color}1c`, color: meta.color }}
              >
                <meta.icon size={18} />
              </span>
              <Select
                value={form.category}
                className="flex-1"
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Points amount" error={errors.amount}>
              <div className="relative">
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="e.g. 140"
                  invalid={!!errors.amount}
                  className="pr-11 tabular-nums"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-soft">
                  pts
                </span>
              </div>
            </Field>
            <Field label="Date" error={errors.date}>
              <TextInput
                type="date"
                value={form.date}
                invalid={!!errors.date}
                max={todayISO()}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes / event name (optional)">
            <TextArea
              rows={2}
              placeholder="e.g. Genshin Impact quest, Double points weekend…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="text" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add entry"}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

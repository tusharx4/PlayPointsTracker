"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { ACCOUNT_COLORS, type Account } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Button } from "./ui/kit";
import { Field, TextInput } from "./ui/fields";
import { Modal } from "./ui/dialogs";

export function AccountModal({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Account | null;
  onClose: () => void;
}) {
  const { data, addAccount, updateAccount, showToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setErrors({});
      setName(editing?.name ?? "");
      setEmail(editing?.email ?? "");
      setColor(editing?.color ?? ACCOUNT_COLORS[data.accounts.length % ACCOUNT_COLORS.length]);
    }
    wasOpen.current = open;
  }, [open, editing, data.accounts.length]);

  const save = () => {
    const errs: typeof errors = {};
    const e = email.trim().toLowerCase();
    if (!name.trim()) errs.name = "Give this profile a name.";
    if (!/^\S+@\S+\.\S+$/.test(e)) errs.email = "Enter a valid email address.";
    else if (data.accounts.some((a) => a.email.toLowerCase() === e && a.id !== editing?.id))
      errs.email = "An account with this email already exists.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      updateAccount({ ...editing, name: name.trim(), email: e, color });
      showToast("Account updated.");
    } else {
      addAccount({ name: name.trim(), email: e, color });
      showToast(`Account ${e} added.`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit account" : "Add mail account"}>
      <div className="space-y-4">
        <Field label="Name" error={errors.name}>
          <TextInput
            placeholder="e.g. Alex Rivera"
            value={name}
            invalid={!!errors.name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>

        <Field label="Google Mail address" error={errors.email}>
          <TextInput
            type="email"
            placeholder="you@gmail.com"
            value={email}
            invalid={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Badge color">
          <div className="flex flex-wrap gap-2.5">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition active:scale-90 ${
                  color === c ? "ring-2 ring-acc ring-offset-2 ring-offset-card" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save changes" : "Add account"}</Button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, IconButton } from "./kit";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={`anim-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-t border-line/60 bg-card p-5 shadow-2xl sm:max-h-[86dvh] sm:rounded-3xl sm:border sm:p-6 ${
          wide ? "sm:max-w-lg" : "sm:max-w-md"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold leading-snug text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmHost() {
  const { confirmState, resolveConfirm } = useStore();
  return (
    <Modal open={!!confirmState} onClose={() => resolveConfirm(false)} title={confirmState?.title ?? ""}>
      <p className="text-sm leading-relaxed text-ink-soft">{confirmState?.message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={() => resolveConfirm(false)}>
          {confirmState?.cancelLabel ?? "Cancel"}
        </Button>
        <Button
          variant={confirmState?.danger ? "danger" : "filled"}
          onClick={() => resolveConfirm(true)}
        >
          {confirmState?.confirmLabel ?? "Confirm"}
        </Button>
      </div>
    </Modal>
  );
}

export function ToastHost() {
  const { toast, dismissToast } = useStore();
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="anim-sheet fixed bottom-[92px] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-6"
      role="status"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-toast py-2 pl-4 pr-2 text-toast-ink shadow-xl">
        <p className="flex-1 text-[13.5px] leading-snug">{toast.message}</p>
        {toast.actionLabel && (
          <button
            className="h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold text-toast-ac transition hover:bg-white/10"
            onClick={() => {
              toast.onAction?.();
              dismissToast();
            }}
          >
            {toast.actionLabel}
          </button>
        )}
        <IconButton
          label="Dismiss"
          className="text-toast-ink hover:bg-white/10"
          onClick={dismissToast}
        >
          <X size={15} />
        </IconButton>
      </div>
    </div>
  );
}

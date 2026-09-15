"use client";

import React from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { ShellCtx } from "@/lib/types";
import { TransactionHistory } from "@/components/TransactionHistory";

export default function HistoryPage() {
  const { openAdd, openEdit } = useOutletContext<ShellCtx>();
  const [searchParams] = useSearchParams();
  const initialAccount = searchParams.get("account") ?? "all";

  return (
    <TransactionHistory key={initialAccount} onAdd={openAdd} onEdit={openEdit} initialAccount={initialAccount} />
  );
}

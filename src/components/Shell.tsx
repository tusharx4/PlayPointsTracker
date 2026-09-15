"use client";

import React, { useState } from "react";
import {
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  History,
  LayoutDashboard,
  Moon,
  Plus,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import type { Account, ShellCtx, Tx } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Button, Fab, IconButton, Logo, useRipple } from "./ui/kit";
import { ConfirmHost, ToastHost } from "./ui/dialogs";
import { TransactionModal } from "./TransactionModal";
import { AccountModal } from "./AccountModal";
import DashboardPage from "@/routes/DashboardPage";
import AccountsPage from "@/routes/AccountsPage";
import HistoryPage from "@/routes/HistoryPage";
import AnalyticsPage from "@/routes/AnalyticsPage";
import SettingsPage from "@/routes/SettingsPage";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const TITLES: Record<string, string> = {
  "/": "Overview",
  "/accounts": "Accounts & Balances",
  "/history": "Transaction History",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <Logo size={56} />
        <p className="text-sm font-medium text-ink-soft">Play Points Tracker</p>
      </div>
    </div>
  );
}

function Chrome() {
  const { data, theme, toggleTheme, showToast } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ripple = useRipple();
  const title = TITLES[pathname] ?? "Play Points";

  const [txModal, setTxModal] = useState<{ open: boolean; editing: Tx | null }>({
    open: false,
    editing: null,
  });
  const [acctModal, setAcctModal] = useState<{ open: boolean; editing: Account | null }>({
    open: false,
    editing: null,
  });

  const openAdd = () => {
    if (data.accounts.length === 0) {
      showToast("Add a Google account first.");
      setAcctModal({ open: true, editing: null });
    } else {
      setTxModal({ open: true, editing: null });
    }
  };

  const ctx: ShellCtx = {
    openAdd,
    openEdit: (t) => setTxModal({ open: true, editing: t }),
    openAddAccount: () => setAcctModal({ open: true, editing: null }),
    openEditAccount: (a) => setAcctModal({ open: true, editing: a }),
  };

  return (
    <div className="min-h-dvh">
      {/* desktop side navigation rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r border-line/70 bg-card py-3 md:flex">
        <button
          onClick={() => navigate("/")}
          className="mb-5 transition active:scale-95"
          aria-label="Go to dashboard"
          onPointerDown={ripple}
        >
          <Logo size={40} />
        </button>
        <nav className="flex flex-col gap-1.5">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                onPointerDown={ripple}
                aria-label={n.label}
                className={`relative isolate flex w-16 select-none flex-col items-center gap-1 overflow-hidden rounded-2xl py-2.5 transition ${
                  active ? "bg-acc-soft text-acc-ink" : "text-ink-soft hover:bg-ink/6"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto">
          <IconButton
            label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </div>
      </aside>

      <div className="md:pl-[76px]">
        {/* top app bar */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <span className="md:hidden">
              <Logo size={34} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[17px] font-semibold leading-tight text-ink">
                {title}
              </h1>
              <p className="hidden text-[12px] leading-tight text-ink-soft sm:block">
                Google Play rewards · all your mail accounts
              </p>
            </div>
            <IconButton
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
              className="md:hidden"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </IconButton>
            <Button
              className="hidden md:inline-flex"
              icon={<Plus size={17} strokeWidth={2.5} />}
              onClick={openAdd}
            >
              Add entry
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:pb-14 md:pt-5">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* quick-add FAB */}
      <Fab
        label="Add points entry"
        className="fixed bottom-[92px] right-4 z-30 md:bottom-8 md:right-8"
        onClick={openAdd}
      >
        <Plus size={24} strokeWidth={2.5} />
      </Fab>

      {/* mobile bottom navigation (Play Store style) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                onPointerDown={ripple}
                aria-label={n.label}
                className="relative flex flex-1 select-none flex-col items-center gap-1 overflow-hidden py-2"
              >
                <span
                  className={`flex items-center justify-center rounded-full px-3 py-1.5 transition ${
                    active ? "bg-acc-soft text-acc-ink" : "text-ink-soft"
                  }`}
                >
                  <Icon size={19} />
                </span>
                <span
                  className={`text-[10px] font-medium ${active ? "text-ink" : "text-ink-soft"}`}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* modals */}
      <TransactionModal
        open={txModal.open}
        editing={txModal.editing}
        onClose={() => setTxModal((m) => ({ ...m, open: false }))}
        onAddAccount={() => {
          setTxModal((m) => ({ ...m, open: false }));
          setAcctModal({ open: true, editing: null });
        }}
      />
      <AccountModal
        open={acctModal.open}
        editing={acctModal.editing}
        onClose={() => setAcctModal((m) => ({ ...m, open: false }))}
      />
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}

function RootRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Chrome />}>
        <Route index element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function Shell() {
  const { ready } = useStore();
  if (!ready) return <Splash />;
  // HashRouter only mounts client-side after hydration — keeps static
  // generation safe while giving real multi-page routing.
  return (
    <HashRouter>
      <RootRoutes />
    </HashRouter>
  );
}

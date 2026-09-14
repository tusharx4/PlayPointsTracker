"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/kit";

const ROUTES = ["accounts", "history", "analytics", "settings"];

/**
 * The app routes client-side (/#/accounts …). If someone opens a clean link
 * like /accounts, send them to the matching in-app page instead of a 404.
 */
export default function NotFound() {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const segment = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    if (ROUTES.includes(segment)) {
      window.location.replace(`/#/${segment}${window.location.search}`);
    } else {
      setMissing(true);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <Logo size={56} />
      {missing ? (
        <>
          <h1 className="text-lg font-semibold text-ink">Page not found</h1>
          <a href="/" className="rounded-full bg-acc px-5 py-2.5 text-sm font-medium text-on-acc">
            Open Play Points
          </a>
        </>
      ) : (
        <p className="text-sm text-ink-soft">Opening Play Points…</p>
      )}
    </div>
  );
}

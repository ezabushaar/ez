"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "sync" | "reanalyze">(null);
  const [message, setMessage] = useState<string | null>(null);

  async function sync(reanalyze: boolean) {
    setLoading(reanalyze ? "reanalyze" : "sync");
    setMessage(null);
    try {
      const url = reanalyze ? "/api/woo/sync?reanalyze=1" : "/api/woo/sync";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const parts = [`Synced ${data.count} products`];
        if (data.aiUsed) {
          parts.push(`analyzed ${data.analyzed}`);
          parts.push(`auto-mapped ${data.mapped}`);
        }
        setMessage(parts.join(" · ") + ".");
        router.refresh();
      } else {
        setMessage(data.error ?? "Sync failed");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => sync(false)}
        disabled={loading !== null}
        className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
      >
        {loading === "sync" ? "Syncing & analyzing…" : "Sync WooCommerce products"}
      </button>
      <button
        onClick={() => sync(true)}
        disabled={loading !== null}
        className="rounded-full border border-sand-200 px-5 py-2 text-sm font-medium hover:bg-sand-50 disabled:opacity-50"
        title="Re-run AI analysis on every product, overwriting existing auto-detected mappings"
      >
        {loading === "reanalyze" ? "Re-analyzing…" : "Re-analyze all"}
      </button>
      {message && <span className="text-sm text-night-800/70">{message}</span>}
    </div>
  );
}

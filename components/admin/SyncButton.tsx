"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/woo/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`Synced ${data.count} products from your WordPress store.`);
        router.refresh();
      } else {
        setMessage(data.error ?? "Sync failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={sync}
        disabled={loading}
        className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
      >
        {loading ? "Syncing…" : "Sync WooCommerce products"}
      </button>
      {message && <span className="text-sm text-night-800/70">{message}</span>}
    </div>
  );
}

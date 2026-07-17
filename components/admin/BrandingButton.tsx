"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrandingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pull() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/branding", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const bits: string[] = [];
        bits.push(data.found?.logo ? "logo ✓" : "logo ✗");
        bits.push(data.found?.accent ? "colors ✓" : "colors (default)");
        if (data.found?.rtl) bits.push("RTL");
        setMessage(`Matched store design — ${bits.join(", ")}. Reloading…`);
        setTimeout(() => router.refresh(), 900);
      } else {
        setMessage(data.error ?? "Couldn't pull branding");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={pull}
        disabled={loading}
        className="rounded-full border border-sand-200 px-5 py-2 text-sm font-medium hover:bg-sand-50 disabled:opacity-50"
      >
        {loading ? "Matching store design…" : "Match itsmarsa.com design"}
      </button>
      {message && <span className="text-sm text-night-800/70">{message}</span>}
    </div>
  );
}

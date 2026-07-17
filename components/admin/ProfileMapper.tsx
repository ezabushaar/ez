"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Fragrance } from "@/lib/types";

interface Props {
  productId: number;
  currentFragrance: Fragrance | null;
}

export default function ProfileMapper({ productId, currentFragrance }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Fragrance[]>([]);
  const [selected, setSelected] = useState<Fragrance | null>(currentFragrance);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setAiAvailable(Boolean(data.aiAvailable));
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  async function askAi() {
    setAiLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.fragrance) {
        setSelected(data.fragrance);
        setResults([]);
        setQuery("");
      } else {
        setMessage(data.error ?? "AI couldn't identify that perfume.");
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragranceId: selected?.id ?? null }),
      });
      if (res.ok) {
        setMessage("Saved.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5">
      <h3 className="font-medium">&quot;Inspired by&quot; fragrance</h3>
      <p className="mt-1 text-sm text-night-800/60">
        Pick the famous perfume this product smells like. Its notes become this
        product&apos;s scent profile for matching.
      </p>

      {selected ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-night-800/50">
              {selected.brand}
            </div>
            <div className="font-medium">{selected.name}</div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="relative mt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search perfumes…"
            className="w-full rounded-xl border border-sand-200 px-4 py-2.5 outline-none focus:border-gold-400"
          />
          {query.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-sand-200 bg-white shadow-lg">
              {results.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelected(f);
                    setQuery("");
                    setResults([]);
                  }}
                  className="block w-full px-4 py-2.5 text-left hover:bg-sand-50"
                >
                  <span className="font-medium">{f.name}</span>{" "}
                  <span className="text-sm text-night-800/60">{f.brand}</span>
                </button>
              ))}
              {results.length === 0 && (
                <div className="px-4 py-3 text-sm text-night-800/60">
                  No match.
                  {aiAvailable && (
                    <button
                      onClick={askAi}
                      disabled={aiLoading}
                      className="ml-2 font-medium text-gold-600 hover:underline disabled:opacity-50"
                    >
                      {aiLoading ? "Asking AI…" : "Ask AI"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-night-900 px-5 py-2 text-sm font-medium text-white hover:bg-night-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save mapping"}
        </button>
        {message && <span className="text-sm text-night-800/70">{message}</span>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Fragrance } from "@/lib/types";

export default function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Fragrance[]>([]);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [searching, setSearching] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setAiMessage(null);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setAiAvailable(Boolean(data.aiAvailable));
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  async function askAi() {
    setAiLoading(true);
    setAiMessage(null);
    try {
      const res = await fetch("/api/ai/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.fragrance) {
        router.push(`/perfume/${data.fragrance.id}`);
      } else {
        setAiMessage(
          data.error ??
            "We couldn't identify that perfume. Try the full brand and name.",
        );
      }
    } catch {
      setAiMessage("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder='Try "Baccarat Rouge 540" or "Sauvage"...'
        className="w-full rounded-full border border-sand-200 bg-white px-5 py-3 text-base shadow-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-lg">
          {results.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/perfume/${f.id}`)}
              className="flex w-full items-baseline justify-between gap-2 px-5 py-3 text-left hover:bg-sand-50"
            >
              <span>
                <span className="font-medium">{f.name}</span>{" "}
                <span className="text-sm text-night-800/60">{f.brand}</span>
              </span>
              <span className="text-xs uppercase tracking-wide text-night-800/40">
                {f.gender}
              </span>
            </button>
          ))}
          {results.length === 0 && !searching && (
            <div className="px-5 py-4 text-sm text-night-800/70">
              <p>No match in our database.</p>
              {aiAvailable && (
                <button
                  onClick={askAi}
                  disabled={aiLoading}
                  className="mt-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-50"
                >
                  {aiLoading ? "Asking AI…" : `Ask AI about "${query}"`}
                </button>
              )}
              {aiMessage && <p className="mt-2 text-red-600">{aiMessage}</p>}
            </div>
          )}
          {searching && (
            <div className="px-5 py-3 text-sm text-night-800/50">Searching…</div>
          )}
        </div>
      )}
    </div>
  );
}

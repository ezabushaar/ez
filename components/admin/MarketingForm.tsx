"use client";

import { useState } from "react";
import type { MarsaProduct } from "@/lib/types";

const CONTENT_TYPES = [
  { value: "instagram_caption", label: "Instagram caption" },
  { value: "tiktok_hook", label: "TikTok hooks" },
  { value: "product_description", label: "Product description" },
  { value: "ad_copy", label: "Ad copy (Meta/TikTok)" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "arabic", label: "Arabic" },
  { value: "both", label: "English + Arabic" },
];

export default function MarketingForm({
  products,
  aiAvailable,
}: {
  products: MarsaProduct[];
  aiAvailable: boolean;
}) {
  const [productId, setProductId] = useState<number | "">(
    products[0]?.id ?? "",
  );
  const [contentType, setContentType] = useState("instagram_caption");
  const [language, setLanguage] = useState("english");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!productId) return;
    setLoading(true);
    setError(null);
    setContent(null);
    setCopied(false);
    try {
      const res = await fetch("/api/ai/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          contentType,
          language,
          extraInstructions: extra || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setContent(data.content);
      } else {
        setError(data.error ?? "Generation failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!aiAvailable) {
    return (
      <p className="rounded-2xl border border-dashed border-sand-200 bg-white p-6 text-sm text-night-800/60">
        AI is not configured. Add <code>ANTHROPIC_API_KEY</code> to your{" "}
        <code>.env</code> file to enable the marketing generator.
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-sand-200 bg-white p-6 text-sm text-night-800/60">
        No products yet — sync your WooCommerce store from the dashboard first.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <label className="block text-sm font-medium">Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium">Content type</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setContentType(ct.value)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                contentType === ct.value
                  ? "bg-night-900 text-white"
                  : "bg-sand-100 hover:bg-sand-200"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">Language</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => setLanguage(l.value)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                language === l.value
                  ? "bg-night-900 text-white"
                  : "bg-sand-100 hover:bg-sand-200"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">
          Extra instructions <span className="text-night-800/50">(optional)</span>
        </label>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={3}
          placeholder="e.g. Ramadan promotion, 20% off this week, target young professionals…"
          className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5 outline-none focus:border-gold-400"
        />

        <button
          onClick={generate}
          disabled={loading || !productId}
          className="mt-4 w-full rounded-xl bg-gold-500 py-2.5 font-medium text-white hover:bg-gold-600 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate content"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Generated content</h3>
          {content && (
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-full bg-sand-100 px-4 py-1.5 text-sm hover:bg-sand-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <div className="mt-3 min-h-64 whitespace-pre-wrap rounded-xl bg-sand-50 p-4 text-sm leading-relaxed">
          {loading
            ? "Writing your copy…"
            : content ?? "Generated content will appear here."}
        </div>
      </div>
    </div>
  );
}

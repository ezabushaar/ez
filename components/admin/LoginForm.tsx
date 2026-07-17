"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Wrong password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-16 max-w-sm rounded-3xl border border-sand-200 bg-white p-8"
    >
      <h1 className="text-xl font-semibold">Marsa team login</h1>
      <p className="mt-1 text-sm text-night-800/60">
        Enter the admin password to manage products and marketing.
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        className="mt-4 w-full rounded-xl border border-sand-200 px-4 py-2.5 outline-none focus:border-gold-400"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 w-full rounded-xl bg-night-900 py-2.5 font-medium text-white hover:bg-night-800 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

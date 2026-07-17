import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import MarketingForm from "@/components/admin/MarketingForm";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { listProducts } from "@/lib/db";
import { aiAvailable } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  if (!adminConfigured() || !(await isAdmin())) {
    return <LoginForm />;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-night-800/60 hover:text-gold-600">
        ← Back to admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">AI marketing generator</h1>
      <p className="mt-1 max-w-2xl text-sm text-night-800/60">
        Pick a product and Claude writes on-brand, legally-safe marketing copy
        using its scent profile and &quot;inspired by&quot; match — Instagram
        captions, TikTok hooks, product descriptions, and ad copy in English or
        Arabic.
      </p>
      <div className="mt-6">
        <MarketingForm products={listProducts()} aiAvailable={aiAvailable()} />
      </div>
    </div>
  );
}

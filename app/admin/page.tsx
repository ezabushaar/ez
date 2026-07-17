import Link from "next/link";
import BrandingButton from "@/components/admin/BrandingButton";
import LoginForm from "@/components/admin/LoginForm";
import LogoutButton from "@/components/admin/LogoutButton";
import SyncButton from "@/components/admin/SyncButton";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { getFragrance, getProductProfile, listProducts } from "@/lib/db";
import { wooConfigured } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <p className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-sand-200 bg-white p-6 text-center text-sm text-night-800/60">
        Admin is not configured. Set <code>ADMIN_PASSWORD</code> in your{" "}
        <code>.env</code> file and restart the app.
      </p>
    );
  }
  if (!(await isAdmin())) {
    return <LoginForm />;
  }

  const products = listProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Marsa admin</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/marketing"
            className="rounded-full bg-night-900 px-5 py-2 text-sm font-medium text-white hover:bg-night-800"
          >
            AI marketing generator
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="font-medium">Store sync</h2>
        <p className="mt-1 text-sm text-night-800/60">
          {wooConfigured()
            ? "Pull products from your WordPress store. AI reads each product's scent DNA and automatically detects which famous perfume it's inspired by — no manual mapping needed."
            : "WooCommerce is not configured — set WOO_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET in .env to connect your store."}
        </p>
        <div className="mt-3">
          <SyncButton />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="font-medium">Store design</h2>
        <p className="mt-1 text-sm text-night-800/60">
          Pull your store&apos;s logo and colors so this finder matches
          itsmarsa.com. Runs on the server, so it works even though the site
          blocks outside access.
        </p>
        <div className="mt-3">
          <BrandingButton />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-medium">
          Products ({products.length})
        </h2>
        <p className="mt-1 text-sm text-night-800/60">
          Auto-detected on sync. Open any product to review its scent DNA or
          correct the inspired-by match if the AI got one wrong.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-sand-200 bg-white">
          {products.length === 0 && (
            <p className="p-6 text-sm text-night-800/60">
              No products yet. Sync your store above.
            </p>
          )}
          {products.map((product) => {
            const profile = getProductProfile(product.id);
            const inspiredBy = profile?.fragrance_id
              ? getFragrance(profile.fragrance_id)
              : null;
            return (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="flex items-center justify-between gap-4 border-b border-sand-100 px-5 py-4 last:border-0 hover:bg-sand-50"
              >
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-night-800/50">
                      {product.price ?? "—"}
                      {!product.in_stock && " · out of stock"}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  {inspiredBy ? (
                    <span className="text-night-800/70">
                      Inspired by{" "}
                      <span className="font-medium">
                        {inspiredBy.brand} {inspiredBy.name}
                      </span>
                    </span>
                  ) : profile?.notes_override ? (
                    <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-night-800/60">
                      DNA analyzed · no close match
                    </span>
                  ) : (
                    <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-medium text-night-800/50">
                      Pending analysis
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

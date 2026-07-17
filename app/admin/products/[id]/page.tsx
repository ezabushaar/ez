import Link from "next/link";
import { notFound } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import NotePyramid from "@/components/NotePyramid";
import ProfileMapper from "@/components/admin/ProfileMapper";
import { adminConfigured, isAdmin } from "@/lib/auth";
import {
  getEffectiveProfile,
  getFragrance,
  getProduct,
  getProductProfile,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured() || !(await isAdmin())) {
    return <LoginForm />;
  }

  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();

  const profile = getProductProfile(product.id);
  const inspiredBy = profile?.fragrance_id
    ? getFragrance(profile.fragrance_id)
    : null;
  const effective = getEffectiveProfile(product.id);

  return (
    <div>
      <Link href="/admin" className="text-sm text-night-800/60 hover:text-gold-600">
        ← Back to products
      </Link>
      <div className="mt-4 flex items-start gap-5">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-28 w-28 rounded-2xl object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-night-800/60">
            {product.price ?? "—"}
            {product.permalink && (
              <>
                {" · "}
                <a
                  href={product.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-600 hover:underline"
                >
                  View in store
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProfileMapper productId={product.id} currentFragrance={inspiredBy} />
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <h3 className="font-medium">Current scent profile</h3>
          {effective ? (
            <div className="mt-3">
              <NotePyramid profile={effective} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-night-800/60">
              No profile yet — map an &quot;inspired by&quot; fragrance to give
              this product a scent profile for matching.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

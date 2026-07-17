import Link from "next/link";
import { notFound } from "next/navigation";
import NotePyramid from "@/components/NotePyramid";
import SearchBox from "@/components/SearchBox";
import { getFragrance } from "@/lib/db";
import { matchFragrances, matchProducts } from "@/lib/matching";

export const dynamic = "force-dynamic";

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fragranceId = Number(id);
  const fragrance = Number.isInteger(fragranceId)
    ? getFragrance(fragranceId)
    : null;
  if (!fragrance) notFound();

  const products = matchProducts(fragranceId);
  const similar = matchFragrances(fragranceId);

  return (
    <div>
      <div className="mb-8">
        <SearchBox />
      </div>

      <div className="rounded-3xl border border-sand-200 bg-white p-6 sm:p-8">
        <div className="text-sm uppercase tracking-wide text-night-800/50">
          {fragrance.brand}
          {fragrance.source === "ai" && (
            <span className="ml-2 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-medium text-gold-600">
              AI-sourced
            </span>
          )}
        </div>
        <h1 className="mt-1 text-3xl font-semibold">{fragrance.name}</h1>
        <p className="mt-1 text-sm capitalize text-night-800/60">
          {fragrance.gender}
        </p>
        <div className="mt-6">
          <NotePyramid profile={fragrance} />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Marsa perfumes that smell like it
        </h2>
        {products.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-sand-200 bg-white p-6 text-sm text-night-800/60">
            No Marsa products have been matched to this fragrance yet. Check
            back soon — our catalog is always growing.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(({ product, percent, sharedNotes }) => (
              <div
                key={product.id}
                className="flex flex-col rounded-2xl border border-sand-200 bg-white p-4"
              >
                {product.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="mb-3 h-44 w-full rounded-xl object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{product.name}</h3>
                  <span className="shrink-0 rounded-full bg-gold-500 px-2.5 py-1 text-xs font-semibold text-white">
                    {percent}% match
                  </span>
                </div>
                {product.price && (
                  <div className="mt-1 text-sm text-night-800/70">
                    {product.price}
                  </div>
                )}
                {sharedNotes.length > 0 && (
                  <p className="mt-2 text-xs capitalize text-night-800/60">
                    Shared notes: {sharedNotes.slice(0, 5).join(", ")}
                  </p>
                )}
                {product.permalink && (
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto pt-3"
                  >
                    <span className="block rounded-full bg-night-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-night-800">
                      Buy on Marsa store
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Other similar perfumes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {similar.map(({ fragrance: f, percent, sharedNotes }) => (
            <Link
              key={f.id}
              href={`/perfume/${f.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white px-5 py-4 transition hover:border-gold-400"
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-night-800/50">
                  {f.brand}
                </div>
                <div className="font-medium">{f.name}</div>
                {sharedNotes.length > 0 && (
                  <div className="mt-1 text-xs capitalize text-night-800/50">
                    {sharedNotes.slice(0, 4).join(", ")}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-gold-600">
                {percent}%
              </span>
            </Link>
          ))}
          {similar.length === 0 && (
            <p className="text-sm text-night-800/60">
              No similar perfumes found yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

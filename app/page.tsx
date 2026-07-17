import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { countFragrances, getAllFragrances } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const total = countFragrances();
  const popular = getAllFragrances().slice(0, 8);

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="mt-8 max-w-2xl text-4xl font-light leading-tight sm:text-5xl">
        Love a perfume?{" "}
        <span className="font-semibold text-gold-600">
          Find its Marsa match.
        </span>
      </h1>
      <p className="mt-4 max-w-xl text-night-800/70">
        Search any designer or niche fragrance and we&apos;ll show you which
        Marsa perfumes share its DNA — same notes, same vibe, better price.
      </p>

      <div className="mt-8 w-full max-w-xl">
        <SearchBox autoFocus />
      </div>
      <p className="mt-3 text-xs text-night-800/50">
        {total.toLocaleString()} fragrances in our database — and AI looks up
        anything we&apos;re missing.
      </p>

      <section className="mt-16 w-full text-left">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-night-800/50">
          Popular searches
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popular.map((f) => (
            <Link
              key={f.id}
              href={`/perfume/${f.id}`}
              className="rounded-2xl border border-sand-200 bg-white p-4 transition hover:border-gold-400 hover:shadow-sm"
            >
              <div className="text-xs uppercase tracking-wide text-night-800/50">
                {f.brand}
              </div>
              <div className="mt-1 font-medium">{f.name}</div>
              <div className="mt-2 text-xs capitalize text-gold-600">
                {f.accords.slice(0, 3).join(" · ")}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

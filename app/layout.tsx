import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marsa Fragrance Matcher",
  description:
    "Find which Marsa perfumes smell like your favorite designer and niche fragrances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-sand-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-semibold tracking-wide">
              <span className="text-gold-600">Marsa</span>{" "}
              <span className="font-light">Fragrance Matcher</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-gold-600">
                Find your scent
              </Link>
              <Link href="/admin" className="text-night-800/60 hover:text-gold-600">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-night-800/50">
          Marsa products are inspired by the fragrances named here and are not
          affiliated with the original brands.
        </footer>
      </body>
    </html>
  );
}

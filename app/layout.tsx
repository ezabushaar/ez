import type { Metadata } from "next";
import Link from "next/link";
import { brandingCssVars, getBranding } from "@/lib/branding";
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
  const brand = getBranding();
  return (
    <html lang={brand.rtl ? "ar" : "en"} dir={brand.rtl ? "rtl" : "ltr"}>
      <head>
        <style
          // Runtime brand palette → drives the Tailwind color tokens.
          dangerouslySetInnerHTML={{ __html: `:root{${brandingCssVars(brand)}}` }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <header className="border-b border-sand-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              {brand.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoPath}
                  alt={brand.brandName}
                  className="h-9 max-w-[180px] object-contain"
                />
              ) : (
                <span className="text-xl font-semibold tracking-wide">
                  <span className="text-gold-600">{brand.brandName}</span>{" "}
                  <span className="font-light">Fragrance Matcher</span>
                </span>
              )}
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
          {brand.brandName} products are inspired by the fragrances named here
          and are not affiliated with the original brands.
        </footer>
      </body>
    </html>
  );
}

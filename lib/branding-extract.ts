import type { Branding } from "./branding";

// Pure HTML → branding heuristics, kept separate so it can be unit-tested
// without a network call. The API route fetches the store HTML and feeds it in.

function absolutize(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturation(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function darken(hex: string, amount = 0.15): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const adj = (start: number) => {
    const v = Math.round(parseInt(full.slice(start, start + 2), 16) * (1 - amount));
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  };
  return `#${adj(0)}${adj(2)}${adj(4)}`;
}

function firstMatch(re: RegExp, html: string): string | null {
  const m = re.exec(html);
  return m ? m[1] : null;
}

export function extractBranding(
  html: string,
  baseUrl: string,
): Partial<Branding> {
  const out: Partial<Branding> = {};

  // Right-to-left / Arabic detection.
  if (/<html[^>]*\bdir=["']rtl["']/i.test(html) || /<html[^>]*\blang=["']ar/i.test(html)) {
    out.rtl = true;
  }

  // Logo — try the WordPress custom-logo class first, then any header logo img.
  const logo =
    firstMatch(/class="[^"]*custom-logo[^"]*"[^>]*\bsrc="([^"]+)"/i, html) ||
    firstMatch(/\bsrc="([^"]+)"[^>]*class="[^"]*custom-logo[^"]*"/i, html) ||
    firstMatch(/<img[^>]*class="[^"]*logo[^"]*"[^>]*\bsrc="([^"]+)"/i, html) ||
    firstMatch(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*href="([^"]+)"/i, html);
  if (logo) out.logoPath = absolutize(logo, baseUrl);

  // Brand name from <title> or og:site_name.
  const siteName =
    firstMatch(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i, html) ||
    firstMatch(/<title[^>]*>([^<|–-]+)/i, html);
  if (siteName) out.brandName = siteName.trim().slice(0, 40);

  // Colors — prefer explicit theme signals, then fall back to palette sampling.
  const themeColor = firstMatch(
    /<meta[^>]*name="theme-color"[^>]*content="(#[0-9a-fA-F]{3,6})"/i,
    html,
  );
  const presetPrimary =
    firstMatch(/--wp--preset--color--primary:\s*(#[0-9a-fA-F]{3,6})/i, html) ||
    firstMatch(/--wp--preset--color--accent:\s*(#[0-9a-fA-F]{3,6})/i, html);
  const presetBase = firstMatch(
    /--wp--preset--color--(?:base|background):\s*(#[0-9a-fA-F]{3,6})/i,
    html,
  );
  const presetContrast = firstMatch(
    /--wp--preset--color--(?:contrast|foreground):\s*(#[0-9a-fA-F]{3,6})/i,
    html,
  );

  const accent = presetPrimary || themeColor;
  if (accent) {
    out.accent = accent;
    out.accentDark = darken(accent, 0.18);
    out.accentSoft = darken(accent, -0.15); // negative amount = lighten
  }

  if (presetBase) out.bg = presetBase;
  if (presetContrast) out.text = presetContrast;

  // Fallback: sample hex colors from the document if presets were absent.
  if (!out.accent || !out.bg || !out.text) {
    const hexes = (html.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) =>
      h.toLowerCase(),
    );
    if (hexes.length) {
      const freq = new Map<string, number>();
      for (const h of hexes) freq.set(h, (freq.get(h) ?? 0) + 1);
      const unique = [...freq.keys()];

      if (!out.accent) {
        // Most-used reasonably-saturated, mid-luminance color.
        const candidates = unique
          .filter((h) => saturation(h) > 0.25)
          .filter((h) => {
            const l = hexLuminance(h);
            return l > 0.1 && l < 0.85;
          })
          .sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
        if (candidates[0]) {
          out.accent = candidates[0];
          out.accentDark = darken(candidates[0], 0.18);
          out.accentSoft = darken(candidates[0], -0.15);
        }
      }
      if (!out.bg) {
        const light = unique
          .filter((h) => hexLuminance(h) > 0.9)
          .sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
        if (light[0]) out.bg = light[0];
      }
      if (!out.text) {
        const dark = unique
          .filter((h) => hexLuminance(h) < 0.2)
          .sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
        if (dark[0]) out.text = dark[0];
      }
    }
  }

  return out;
}

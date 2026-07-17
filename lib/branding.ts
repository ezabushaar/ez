import fs from "node:fs";
import path from "node:path";

export interface Branding {
  brandName: string;
  bg: string;
  surface: string;
  text: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  font: string;
  logoPath: string | null;
  rtl: boolean;
}

// Falls back to the built-in cream/gold luxury palette when the store's
// branding hasn't been pulled yet (scripts/pull-branding.ts writes it).
export const DEFAULT_BRANDING: Branding = {
  brandName: "Marsa",
  bg: "#faf7f2",
  surface: "#ffffff",
  text: "#2b2118",
  accent: "#b48a3f",
  accentDark: "#96702e",
  accentSoft: "#c9a35c",
  font: 'Georgia, "Times New Roman", serif',
  logoPath: null,
  rtl: false,
};

const BRANDING_PATH = path.join(process.cwd(), "data", "branding.json");

export function getBranding(): Branding {
  try {
    if (fs.existsSync(BRANDING_PATH)) {
      const raw = JSON.parse(fs.readFileSync(BRANDING_PATH, "utf-8"));
      return { ...DEFAULT_BRANDING, ...raw };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_BRANDING;
}

/** CSS custom properties injected into :root so Tailwind theme tokens resolve. */
export function brandingCssVars(b: Branding): string {
  return [
    `--brand-bg:${b.bg}`,
    `--brand-surface:${b.surface}`,
    `--brand-text:${b.text}`,
    `--brand-accent:${b.accent}`,
    `--brand-accent-dark:${b.accentDark}`,
    `--brand-accent-soft:${b.accentSoft}`,
    `--brand-font:${b.font}`,
  ].join(";");
}

import { describe, expect, it } from "vitest";
import { extractBranding } from "./branding-extract";

describe("extractBranding", () => {
  it("reads a WordPress custom logo and preset colors", () => {
    const html = `
      <html lang="en">
        <head>
          <meta name="theme-color" content="#123456">
          <style>
            :root{
              --wp--preset--color--primary:#8b5e34;
              --wp--preset--color--base:#fbf8f3;
              --wp--preset--color--contrast:#1a1a1a;
            }
          </style>
          <title>Marsa Perfumes | Premium</title>
        </head>
        <body>
          <img class="custom-logo" src="/wp-content/uploads/2024/logo.png" alt="Marsa">
        </body>
      </html>`;
    const b = extractBranding(html, "https://itsmarsa.com");
    expect(b.logoPath).toBe("https://itsmarsa.com/wp-content/uploads/2024/logo.png");
    expect(b.accent).toBe("#8b5e34");
    expect(b.bg).toBe("#fbf8f3");
    expect(b.text).toBe("#1a1a1a");
    expect(b.brandName).toBe("Marsa Perfumes");
    expect(b.rtl).toBeUndefined();
  });

  it("detects RTL / Arabic stores", () => {
    const b = extractBranding('<html dir="rtl" lang="ar"><body></body></html>', "https://x.com");
    expect(b.rtl).toBe(true);
  });

  it("falls back to palette sampling when no presets are present", () => {
    const html = `<html><body style="background:#ffffff;color:#111111">
      <a style="color:#c0392b">buy</a><a style="color:#c0392b">shop</a>
    </body></html>`;
    const b = extractBranding(html, "https://x.com");
    expect(b.accent).toBe("#c0392b");
    expect(b.bg).toBe("#ffffff");
    expect(b.text).toBe("#111111");
  });

  it("returns an empty-ish object for a bare document", () => {
    const b = extractBranding("<html><body>hello</body></html>", "https://x.com");
    expect(b.logoPath).toBeUndefined();
    expect(b.accent).toBeUndefined();
  });
});

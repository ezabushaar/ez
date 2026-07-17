import Anthropic from "@anthropic-ai/sdk";
import type { Fragrance, NoteProfile } from "./types";

const MODEL = "claude-opus-4-8";

export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  return new Anthropic();
}

// ---------------------------------------------------------------------------
// Perfume lookup — used when a searched perfume isn't in the local dataset.

export interface AiPerfumeLookup extends NoteProfile {
  found: boolean;
  brand: string;
  name: string;
  gender: string;
}

const LOOKUP_SCHEMA = {
  type: "object",
  properties: {
    found: {
      type: "boolean",
      description:
        "true only if this is a real, identifiable perfume you have reliable knowledge of",
    },
    brand: { type: "string" },
    name: { type: "string" },
    gender: { type: "string", enum: ["men", "women", "unisex"] },
    top_notes: { type: "array", items: { type: "string" } },
    middle_notes: { type: "array", items: { type: "string" } },
    base_notes: { type: "array", items: { type: "string" } },
    accords: {
      type: "array",
      items: { type: "string" },
      description: "Main accords ordered from most to least prominent, max 6",
    },
  },
  required: [
    "found",
    "brand",
    "name",
    "gender",
    "top_notes",
    "middle_notes",
    "base_notes",
    "accords",
  ],
  additionalProperties: false,
} as const;

export async function lookupPerfume(
  query: string,
): Promise<AiPerfumeLookup | null> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You are a fragrance database expert. Given a perfume name (possibly misspelled " +
      "or partial), identify the real perfume and return its note pyramid and main " +
      "accords using standard fragrance-community terminology (lowercase note names). " +
      "If you cannot confidently identify a real perfume, return found: false with " +
      "empty arrays.",
    messages: [{ role: "user", content: `Perfume to identify: "${query}"` }],
    output_config: {
      format: {
        type: "json_schema",
        schema: LOOKUP_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;

  try {
    const parsed = JSON.parse(text.text) as AiPerfumeLookup;
    return parsed.found ? parsed : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Marketing content generation for Marsa products.

export type ContentType =
  | "instagram_caption"
  | "tiktok_hook"
  | "product_description"
  | "ad_copy";

export type Language = "english" | "arabic" | "both";

const CONTENT_LABELS: Record<ContentType, string> = {
  instagram_caption:
    "an Instagram caption (with a hook first line, 2-4 short paragraphs, emoji used tastefully, and 5-8 relevant hashtags at the end)",
  tiktok_hook:
    "3 alternative TikTok video hooks/scripts (each: a scroll-stopping opening line plus 2-3 beats for the video, under 30 seconds of speaking time)",
  product_description:
    "an e-commerce product description (a headline, an evocative 2-paragraph description walking through the scent journey from opening to dry-down, and a short bullet list of key notes)",
  ad_copy:
    "paid ad copy (3 variants, each with a headline under 40 characters and primary text under 125 characters, optimized for Meta/TikTok ads)",
};

export interface MarketingRequest {
  productName: string;
  price?: string | null;
  inspiredBy?: Fragrance | null;
  profile?: NoteProfile | null;
  contentType: ContentType;
  language: Language;
  extraInstructions?: string;
}

export async function generateMarketing(
  req: MarketingRequest,
): Promise<string> {
  const client = getClient();

  const scentLines: string[] = [];
  const profile = req.profile ?? req.inspiredBy;
  if (profile) {
    scentLines.push(`Top notes: ${profile.top_notes.join(", ")}`);
    scentLines.push(`Heart notes: ${profile.middle_notes.join(", ")}`);
    scentLines.push(`Base notes: ${profile.base_notes.join(", ")}`);
    scentLines.push(`Main accords: ${profile.accords.join(", ")}`);
  }
  if (req.inspiredBy) {
    scentLines.push(
      `Scent profile is similar to: ${req.inspiredBy.brand} ${req.inspiredBy.name}`,
    );
  }

  const languageInstruction =
    req.language === "both"
      ? "Write the content in English first, then an Arabic version (Modern Standard Arabic with a natural, warm marketing tone — not a literal translation)."
      : req.language === "arabic"
        ? "Write the content in Arabic (Modern Standard Arabic with a natural, warm marketing tone)."
        : "Write the content in English.";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system:
      "You are the marketing copywriter for Marsa, a perfume brand that sells " +
      "high-quality fragrances inspired by famous designer and niche perfumes at " +
      "accessible prices. Your copy is sensory, confident, and modern.\n\n" +
      "LEGAL RULES (always follow):\n" +
      "- Never claim a Marsa product IS the original perfume or contains the original formula.\n" +
      '- Use phrasing like "inspired by", "reminiscent of", "if you love X, you\'ll love this".\n' +
      "- Never use the original brand's logos or taglines; naming the perfume for comparison is fine.\n" +
      "- No false claims about longevity, ingredients, or awards.",
    messages: [
      {
        role: "user",
        content:
          `Write ${CONTENT_LABELS[req.contentType]} for this Marsa product.\n\n` +
          `Product: ${req.productName}\n` +
          (req.price ? `Price: ${req.price}\n` : "") +
          (scentLines.length ? `${scentLines.join("\n")}\n` : "") +
          `\n${languageInstruction}\n` +
          (req.extraInstructions
            ? `\nAdditional instructions from the marketing team: ${req.extraInstructions}`
            : "") +
          `\nReturn only the content itself, ready to copy-paste — no preamble or commentary.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to generate this content.");
  }
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

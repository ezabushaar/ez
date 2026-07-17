export interface NoteProfile {
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  accords: string[];
}

export interface Fragrance extends NoteProfile {
  id: number;
  brand: string;
  name: string;
  gender: string;
  source: "dataset" | "ai";
  image_url: string | null;
  logo_url: string | null;
}

export interface MarsaProduct {
  id: number;
  woo_id: number | null;
  name: string;
  price: string | null;
  image_url: string | null;
  permalink: string | null;
  in_stock: boolean;
  synced_at: string | null;
}

export interface ProductProfile {
  product_id: number;
  fragrance_id: number | null;
  notes_override: NoteProfile | null;
}

export interface MatchResult {
  score: number;
  sharedNotes: string[];
  sharedAccords: string[];
}

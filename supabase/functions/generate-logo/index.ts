/**
 * Edge Function: generate-logo
 *
 * 1. Extracts brand intent from the user's raw natural-language request via Claude Haiku.
 * 2. Makes 3 PARALLEL Ideogram v3 calls with different style directives for genuine diversity.
 * 3. Returns { logos: [{url, seed, prompt}], extractedBrandName, generationTime }
 *
 * Request body:
 *   userRequest: string          - raw user message, e.g. "create a logo for connor bet"
 *   primaryColor?: string        - rgba string from current palette
 *   secondaryColor?: string      - rgba string from current palette
 *   fallbackBrandName?: string   - used only if extraction fails
 */

const IDEOGRAM_API = "https://api.ideogram.ai/v1/ideogram-v3/generate";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

import { makeCorsHeaders } from "../_shared/cors.ts";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RequestBody {
  userRequest: string;
  primaryColor?: string;
  secondaryColor?: string;
  fallbackBrandName?: string;
}

interface BrandExtraction {
  brandName: string;
  designNotes: string;
  mood: string;
}

interface IdeogramImage {
  url: string;
  prompt: string;
  resolution: string;
  seed: number;
  is_image_safe: boolean;
}

interface IdeogramResponse {
  created: string;
  data: IdeogramImage[];
}

/* ── Style variants for diversity ──────────────────────────────────────────── */

const STYLE_VARIANTS = [
  {
    suffix: "Iconic symbol combined with wordmark, horizontal layout - icon on left, brand name on right. Bold, energetic.",
    aspectRatio: "1x1",
  },
  {
    suffix: "Bold wordmark only - stylized custom typography, tight letter spacing, no icon. Clean and modern.",
    aspectRatio: "16x9",
  },
  {
    suffix: "Abstract geometric mark - standalone minimal symbol, no text, strong silhouette, premium feel.",
    aspectRatio: "1x1",
  },
] as const;

/* ── RGBA → Hex ─────────────────────────────────────────────────────────────── */

function rgbaToHex(rgba: string): string | null {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* ── Brand extraction via Claude Haiku ─────────────────────────────────────── */

async function extractBrandIntent(
  userRequest: string,
  fallbackBrandName: string,
  anthropicKey: string,
): Promise<BrandExtraction> {
  const system = `Extract the brand name and design direction from a logo creation request.
Respond with valid JSON only - no markdown, no extra text.
Format: {"brandName": string, "designNotes": string, "mood": string}

Rules:
- brandName: the actual brand/company name the user wants a logo for. Capitalise correctly (e.g. "Connor Bet", "BetNova", "SportyBet").
- designNotes: brief description of the design context (e.g. "Nigerian sportsbook", "premium dark aesthetic", "sports betting app").
- mood: 2-3 tone words (e.g. "bold, energetic", "luxury, sophisticated", "confident, dynamic").
- If no clear brand name is given, use fallback: "${fallbackBrandName}".`;

  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 150,
        system,
        messages: [{ role: "user", content: userRequest }],
      }),
    });

    if (!resp.ok) {
      console.warn(`[generate-logo] Anthropic extraction failed (${resp.status}) - using fallback`);
      return { brandName: fallbackBrandName, designNotes: "iGaming sportsbook", mood: "bold, dynamic" };
    }

    const json = await resp.json();
    const raw: string = json.content?.[0]?.text ?? "";
    // Strip potential markdown fences
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as BrandExtraction;

    if (!parsed.brandName?.trim()) {
      parsed.brandName = fallbackBrandName;
    }

    console.log(`[generate-logo] Extracted: brandName="${parsed.brandName}", mood="${parsed.mood}"`);
    return parsed;
  } catch (e) {
    console.warn("[generate-logo] Brand extraction error - using fallback:", e);
    return { brandName: fallbackBrandName, designNotes: "iGaming sportsbook", mood: "bold, dynamic" };
  }
}

/* ── Prompt builder ─────────────────────────────────────────────────────────── */

function buildPrompt(
  brandName: string,
  designNotes: string,
  mood: string,
  primaryHex: string | null,
  secondaryHex: string | null,
  styleSuffix: string,
): string {
  const colorLine = [
    primaryHex ? `Primary color: ${primaryHex}.` : null,
    secondaryHex ? `Secondary accent: ${secondaryHex}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    `Professional iGaming brand logo for "${brandName}".`,
    `Context: ${designNotes}.`,
    `Tone: ${mood}.`,
    "Visual quality: bold, modern, premium, clean vector-style, strong silhouette, flat colors.",
    colorLine,
    "Avoid: generic tech logos, casino chips, playing cards, dice, gambling stereotypes.",
    styleSuffix,
    "Background: transparent. Output: high-resolution PNG on transparent background.",
  ]
    .filter(Boolean)
    .join(" ");
}

/* ── Single Ideogram call ───────────────────────────────────────────────────── */

async function callIdeogram(
  prompt: string,
  aspectRatio: string,
  apiKey: string,
): Promise<IdeogramImage | null> {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("rendering_speed", "DEFAULT");
  formData.append("num_images", "1");
  formData.append("aspect_ratio", aspectRatio);
  formData.append("style_type", "DESIGN");
  formData.append("magic_prompt", "ON");

  try {
    const resp = await fetch(IDEOGRAM_API, {
      method: "POST",
      headers: { "Api-Key": apiKey },
      body: formData,
    });

    if (resp.status === 429) {
      const retryAfter = resp.headers.get("Retry-After") ?? "60";
      console.warn(`[generate-logo] Ideogram rate limited. Retry-After: ${retryAfter}s`);
      return null;
    }

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[generate-logo] Ideogram API error ${resp.status}:`, errBody);
      return null;
    }

    const data: IdeogramResponse = await resp.json();
    return data.data?.[0] ?? null;
  } catch (e) {
    console.error("[generate-logo] Ideogram network error:", e);
    return null;
  }
}

/* ── Main handler ───────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = makeCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const IDEOGRAM_API_KEY = Deno.env.get("IDEOGRAM_API_KEY");
  if (!IDEOGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: "IDEOGRAM_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { userRequest, primaryColor, secondaryColor, fallbackBrandName = "the platform" } = body;

  if (!userRequest || typeof userRequest !== "string" || userRequest.trim().length === 0) {
    return new Response(JSON.stringify({ error: "userRequest is required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const fnStart = Date.now();
  console.log(`[generate-logo] Request: "${userRequest.slice(0, 100)}", fallback: "${fallbackBrandName}"`);

  // Step 1: Extract brand intent from user's raw message
  const extraction = await extractBrandIntent(userRequest, fallbackBrandName, ANTHROPIC_API_KEY);

  const primaryHex = primaryColor ? rgbaToHex(primaryColor) : null;
  const secondaryHex = secondaryColor ? rgbaToHex(secondaryColor) : null;

  console.log(`[generate-logo] Launching 3 parallel Ideogram calls for "${extraction.brandName}"`);

  // Step 2: 3 parallel Ideogram calls - each with a distinct style directive
  const results = await Promise.all(
    STYLE_VARIANTS.map(({ suffix, aspectRatio }) =>
      callIdeogram(
        buildPrompt(extraction.brandName, extraction.designNotes, extraction.mood, primaryHex, secondaryHex, suffix),
        aspectRatio,
        IDEOGRAM_API_KEY,
      )
    )
  );

  const logos = results
    .filter((img): img is IdeogramImage => img !== null)
    .map((img) => ({ url: img.url, seed: img.seed, prompt: img.prompt }));

  const elapsedMs = Date.now() - fnStart;
  console.log(`[generate-logo] Done in ${elapsedMs}ms. Variants returned: ${logos.length}/3`);

  if (logos.length === 0) {
    return new Response(
      JSON.stringify({ error: "All Ideogram calls failed - try again" }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ logos, extractedBrandName: extraction.brandName, generationTime: elapsedMs }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});

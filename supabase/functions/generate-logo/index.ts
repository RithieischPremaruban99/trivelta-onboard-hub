/**
 * Edge Function: generate-logo
 *
 * Generates iGaming brand logo variants via Ideogram v3 API.
 * Returns 3 image URLs for the user to choose from in the Studio chat.
 *
 * Request body:
 *   brandPrompt: string        — e.g. "BetNova — Nigerian sportsbook"
 *   style?: "wordmark" | "icon" | "combined"  (default: "combined")
 *   primaryColor?: string      — rgba string from current palette
 *   secondaryColor?: string    — rgba string from current palette
 *   brandName?: string         — explicit brand name if known
 *
 * Response:
 *   { logos: [{ url, seed, prompt }], generationTime: number }
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const IDEOGRAM_API = "https://api.ideogram.ai/v1/ideogram-v3/generate";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RequestBody {
  brandPrompt: string;
  style?: "wordmark" | "icon" | "combined";
  primaryColor?: string;
  secondaryColor?: string;
  brandName?: string;
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

/* ── Prompt builder ─────────────────────────────────────────────────────────── */

function buildIdeogramPrompt(
  brandName: string,
  style: "wordmark" | "icon" | "combined",
  primaryHex: string | null,
  secondaryHex: string | null,
): string {
  const colorLine = [
    primaryHex ? `Primary color: ${primaryHex}.` : null,
    secondaryHex ? `Secondary accent: ${secondaryHex}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const styleGuide =
    style === "wordmark"
      ? "Focus on typography — wordmark only, bold modern sans-serif, tightly kerned, no icon."
      : style === "icon"
      ? "Focus on an iconic symbol — no text, standalone mark only."
      : "Icon + wordmark horizontal layout, icon left, brand name right.";

  return [
    `Professional iGaming sportsbook brand logo for ${brandName}.`,
    "Style: bold, dynamic, modern, energetic, premium.",
    "Composition: clean vector-style design, flat colors, strong silhouette, minimal details.",
    "Tone: trustworthy yet exciting, suggests movement, energy, and winning.",
    colorLine,
    "Optional visual elements: lightning bolts, stylized sport elements, arrows suggesting velocity, crown or shield for premium feel.",
    "Avoid: generic tech logos, casino chips, playing cards, dice, or gambling stereotypes unless explicitly requested.",
    styleGuide,
    "Background: transparent.",
    "Output: high-resolution PNG on transparent background.",
  ]
    .filter(Boolean)
    .join(" ");
}

/* ── Main handler ───────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  // CORS preflight
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
    console.error("[generate-logo] IDEOGRAM_API_KEY secret not configured");
    return new Response(JSON.stringify({ error: "IDEOGRAM_API_KEY not configured" }), {
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

  const { brandPrompt, style = "combined", primaryColor, secondaryColor, brandName } = body;

  if (!brandPrompt || typeof brandPrompt !== "string" || brandPrompt.trim().length === 0) {
    return new Response(JSON.stringify({ error: "brandPrompt is required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Resolve brand name — use explicit name, or extract first capitalised token from prompt
  const resolvedBrandName =
    brandName?.trim() ||
    (() => {
      const m = brandPrompt.match(/\b([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)*)\b/);
      return m ? m[1] : brandPrompt.split(" ").slice(0, 3).join(" ");
    })();

  const primaryHex = primaryColor ? rgbaToHex(primaryColor) : null;
  const secondaryHex = secondaryColor ? rgbaToHex(secondaryColor) : null;
  const prompt = buildIdeogramPrompt(resolvedBrandName, style, primaryHex, secondaryHex);

  // Aspect ratio: wide for wordmark, square for icon/combined
  const aspectRatio = style === "wordmark" ? "16x9" : "1x1";

  console.log(
    `[generate-logo] Calling Ideogram v3 with brand: ${resolvedBrandName}, style: ${style}, rendering_speed: DEFAULT`
  );

  const callStart = Date.now();

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("rendering_speed", "DEFAULT");
  formData.append("num_images", "3");
  formData.append("aspect_ratio", aspectRatio);
  formData.append("style_type", "DESIGN");
  formData.append("magic_prompt", "ON");

  let ideogramResp: Response;
  try {
    ideogramResp = await fetch(IDEOGRAM_API, {
      method: "POST",
      headers: {
        "Api-Key": IDEOGRAM_API_KEY,
      },
      body: formData,
    });
  } catch (networkErr) {
    console.error("[generate-logo] Network error calling Ideogram:", networkErr);
    return new Response(
      JSON.stringify({ error: "Network error reaching Ideogram API" }),
      { status: 504, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const elapsedMs = Date.now() - callStart;

  if (ideogramResp.status === 429) {
    const retryAfter = ideogramResp.headers.get("Retry-After") ?? "60";
    console.warn(`[generate-logo] Rate limited by Ideogram. Retry-After: ${retryAfter}s`);
    return new Response(
      JSON.stringify({ error: `Rate limited — try again in ${retryAfter} seconds` }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  if (!ideogramResp.ok) {
    const errBody = await ideogramResp.text();
    console.error(`[generate-logo] Ideogram API error ${ideogramResp.status}:`, errBody);
    return new Response(
      JSON.stringify({ error: `Ideogram API error (${ideogramResp.status})`, detail: errBody }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  let ideogramData: IdeogramResponse;
  try {
    ideogramData = await ideogramResp.json();
  } catch {
    console.error("[generate-logo] Failed to parse Ideogram response");
    return new Response(
      JSON.stringify({ error: "Failed to parse Ideogram response" }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const images = ideogramData.data ?? [];
  console.log(
    `[generate-logo] Ideogram responded in ${elapsedMs}ms, images: ${images.length}`
  );

  if (images.length === 0) {
    console.error("[generate-logo] Ideogram returned 0 images");
    return new Response(
      JSON.stringify({ error: "Ideogram returned no images" }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const logos = images.map((img) => ({
    url: img.url,
    seed: img.seed,
    prompt: img.prompt,
  }));

  return new Response(
    JSON.stringify({ logos, generationTime: elapsedMs }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});

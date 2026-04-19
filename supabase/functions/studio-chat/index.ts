// Edge Function: studio-chat
// Sends messages to Claude for theme configuration, and detects logo/icon
// generation requests to call DALL-E 3 in parallel.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a platform design consultant at Trivelta iGaming. You help clients configure their platform's visual identity. Be professional, direct, and concise.

RULES:
- Maximum 2-3 sentences per response unless explaining something technical
- No emojis ever
- No marketing language or hype
- No em dashes - use hyphens instead
- No asterisks for bold in responses - write plainly
- When confirming an action: one short sentence is enough

COLORS:
- Extract hex values from natural language descriptions
- 'green like WhatsApp' = #25D366, 'dark blue like Telegram' = #0088cc, 'orange like BetKing' = #f97316
- Always output a JSON block at the end with only changed keys
- Valid keys: primaryBg, primary, secondary, primaryButton, primaryButtonGradient, wonGradient1, wonGradient2, boxGradient1, boxGradient2, headerBorder1, headerBorder2, lightText, placeholder, inactiveButton
- All values must be valid rgba() strings, e.g. "rgba(253, 111, 39, 1)"
- Format the JSON block exactly like this at the very end of your message:
\`\`\`json
{"primaryBg": "rgba(r,g,b,1)", "primary": "rgba(r,g,b,1)"}
\`\`\`

LOGO GENERATION:
- Extract the EXACT brand name from the user message verbatim - never change or interpret it
- If user says 'BetKing' the response must confirm 'BetKing' exactly
- Confirm in one sentence what you are generating
- No descriptions of what the logo will look like before generating
- Do NOT include a JSON color block when the request is purely about logo/icon generation

RESTRICTIONS:
- Only colors, logo, icon, and app name can be changed
- If asked about features, layout, or integrations: 'Layout and features are managed by your Trivelta team.'
- If the request does not require color changes, omit the JSON block entirely`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  clientId: string;
}

/* ── Image-request detection ─────────────────────────────────────────────── */

/**
 * Extract the exact brand name from the user message.
 * Looks for quoted strings first, then capitalised words following
 * known trigger phrases ("for BetKing", "called BetKing", "named BetKing").
 * Falls back to any capitalised word that isn't a common verb.
 */
function extractBrandName(text: string): string | null {
  // 1. Quoted brand name: "BetKing" or 'BetKing'
  const quoted = text.match(/["']([A-Za-z0-9 _-]{1,40})["']/);
  if (quoted) return quoted[1].trim();

  // 2. After trigger phrases: "for BetKing", "called BetKing", "named BetKing", "brand BetKing"
  const afterKeyword = text.match(
    /\b(?:for|called|named|brand|company|platform|app)\s+([A-Z][A-Za-z0-9]{1,30}(?:\s[A-Z][A-Za-z0-9]{1,20})?)/,
  );
  if (afterKeyword) return afterKeyword[1].trim();

  // 3. Any PascalCase / ALL-CAPS word (excluding common verbs and "I")
  const SKIP = new Set(["Create","Generate","Design","Make","Draw","Build","Give","Need","Want","Logo","Icon","App","Brand","Mark"]);
  const words = text.split(/\s+/);
  for (const w of words) {
    const clean = w.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 3 && /^[A-Z]/.test(clean) && !SKIP.has(clean)) {
      return clean;
    }
  }

  return null;
}

function detectImageRequest(text: string): { kind: "logo" | "icon"; brandName: string | null } | null {
  const lower = text.toLowerCase();
  const wantsCreate = /\b(create|generate|design|make|draw|build|give me|need|want)\b/.test(lower);
  const isLogo = /\blogo\b|\bbrand mark\b|\bwordmark\b/.test(lower);
  const isIcon = /\bapp icon\b|\bicon\b|\bfavicon\b/.test(lower);
  if (!wantsCreate || (!isLogo && !isIcon)) return null;
  return { kind: isLogo ? "logo" : "icon", brandName: extractBrandName(text) };
}

async function generateImage(
  brandName: string | null,
  kind: "logo" | "icon",
  openaiKey: string,
): Promise<{ url: string | null; error: string | null }> {
  const brand = brandName ?? "the brand";
  const styled =
    kind === "logo"
      ? `Professional iGaming sports betting platform logo for "${brand}". The text "${brand}" rendered in a bold, modern sans-serif typeface. Horizontal wordmark layout on a solid dark background. Clean, high-contrast design. No extra decorations, no watermarks, no placeholder text.`
      : `Professional app icon for an iGaming sports betting platform called "${brand}". Square composition, bold and iconic, vibrant colors, no text, suitable for iOS/Android home screen.`;

  // Logo: wide 1792x1024 - Icon: square 1024x1024
  const size = kind === "logo" ? "1792x1024" : "1024x1024";

  console.log(`[studio-chat] Generating ${kind} via DALL-E 3, size=${size}`);

  let resp: Response;
  try {
    resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: styled,
        n: 1,
        size,
        quality: "hd",
        style: "vivid",
        // Use url format - b64_json returns 5-10 MB of base64 in JSON
        // which causes edge function response timeouts.
        response_format: "url",
      }),
    });
  } catch (fetchErr) {
    const msg = `Network error calling DALL-E: ${String(fetchErr)}`;
    console.error("[studio-chat]", msg);
    return { url: null, error: msg };
  }

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`[studio-chat] DALL-E ${resp.status} error:`, body);
    return { url: null, error: `Image generation failed (${resp.status}): ${body.slice(0, 200)}` };
  }

  const data = await resp.json();
  console.log("[studio-chat] DALL-E response keys:", Object.keys(data));
  const imageUrl: string | undefined = data.data?.[0]?.url;
  if (!imageUrl) {
    console.error("[studio-chat] DALL-E response missing url:", JSON.stringify(data).slice(0, 500));
    return { url: null, error: "Image generation succeeded but no URL was returned." };
  }

  console.log("[studio-chat] DALL-E image URL received (length:", imageUrl.length, ")");
  return { url: imageUrl, error: null };
}

/* ── Handler ─────────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages }: RequestBody = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    // Detect image request from latest user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const imageReq = lastUser ? detectImageRequest(lastUser.content) : null;

    // Fail fast if logo/icon requested but OPENAI_API_KEY is missing
    if (imageReq && !openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured — add it in Supabase Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Run Claude + (optionally) DALL-E in parallel
    const claudePromise = fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const imagePromise = imageReq && openaiKey
      ? generateImage(imageReq.brandName, imageReq.kind, openaiKey)
      : Promise.resolve({ url: null, error: null });

    const [claudeResp, imageResult] = await Promise.all([claudePromise, imagePromise]);
    const imageUrl = imageResult.url;
    const imageError = imageResult.error;

    if (!claudeResp.ok) {
      const err = await claudeResp.text();
      return new Response(JSON.stringify({ error: err }), {
        status: claudeResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeData = await claudeResp.json();
    const rawText: string = claudeData.content?.[0]?.text ?? "";

    // Extract JSON color config block from Claude's response
    let config: Record<string, string> | null = null;
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
        // Filter out any accidental _ keys and coerce values to strings
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (!k.startsWith("_") && typeof v === "string") filtered[k] = v;
        }
        config = Object.keys(filtered).length > 0 ? filtered : null;
      } catch {
        config = null;
      }
    }

    // Strip the JSON block from the displayed text
    const cleanText = rawText.replace(/```json[\s\S]*?```/, "").trim();

    console.log(`[studio-chat] Responding: text=${cleanText.length}chars, imageUrl=${imageUrl ? "yes" : "null"}, imageError=${imageError ?? "none"}`);
    return new Response(
      JSON.stringify({
        text: cleanText,
        config,
        imageUrl: imageUrl ?? null,
        imageType: imageUrl ? (imageReq?.kind ?? "logo") : null,
        imageError: imageError ?? null,
        requiredSize: imageUrl ? (imageReq?.kind === "logo" ? "1792x1024" : "1024x1024") : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

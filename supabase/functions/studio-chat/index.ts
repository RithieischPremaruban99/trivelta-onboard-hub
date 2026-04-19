// Edge Function: studio-chat (streaming SSE)
// Claude Sonnet 4 with Vision for logo analysis.
// Ideogram V2 primary for logo generation; DALL-E 3 fallback.
// XML state machine streams <chat> tokens live, buffers <patch> until complete.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PATCH_PATHS = new Set([
  "/primaryBg", "/primary", "/secondary",
  "/primaryButton", "/primaryButtonGradient",
  "/wonGradient1", "/wonGradient2",
  "/boxGradient1", "/boxGradient2",
  "/headerGradient1", "/headerGradient2",
  "/lightText", "/placeholderText",
]);

const RGBA_RE = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;

const SYSTEM_PROMPT = `You are a platform design consultant at Trivelta iGaming. You configure the visual identity of sports betting platforms for clients across Africa and beyond.

YOUR CAPABILITIES (only these):
1. Change platform colors
2. Generate logos and brand icons
3. Analyze uploaded/generated logos to suggest matching colors
4. Adjust color schemes based on visual references

YOUR LIMITATIONS (be direct):
- You cannot change layout or navigation structure
- You cannot add new features or sections
- You cannot modify betting odds or game content
- These are managed by the Trivelta technical team

OUTPUT FORMAT — MANDATORY, no exceptions:
<chat>
[1-2 sentences maximum. Plain text. No emojis. No em dashes. No markdown. No asterisks. Professional and direct.]
</chat>
<patch>
[RFC 6902 JSON Patch array. ONLY include if colors are changing. Omit entirely if no color change.]
</patch>

ALLOWED PATCH PATHS — only these 13, nothing else:
/primaryBg /primary /secondary /primaryButton /primaryButtonGradient
/wonGradient1 /wonGradient2 /boxGradient1 /boxGradient2
/headerGradient1 /headerGradient2 /lightText /placeholderText

ALL color values: rgba(R,G,B,1) format with integers 0-255.

COLOR INTELLIGENCE — map natural language to exact values:
- "orange like BetKing / Bet9ja" = rgba(253,111,39,1)
- "green like SportyBet / WhatsApp" = rgba(37,211,102,1)
- "blue like Betway" = rgba(0,134,195,1)
- "purple like bet365" = rgba(103,58,183,1)
- "gold / premium" = rgba(212,175,55,1)
- "dark background" = rgba(10,13,20,1)
- "red / aggressive" = rgba(220,38,38,1)

WHEN IMAGE IS PROVIDED (logo analysis):
- Analyze the dominant colors in the image
- Extract: primary brand color, background color, accent color
- Suggest matching platform colors based on what you see
- Output the color changes as a patch

WHEN USER SAYS "match background to logo" or similar:
- Look at the provided logo image
- Extract the dominant dark/background color from it
- Apply it to primaryBg
- Extract the primary brand color
- Apply it to primary, primaryButton, primaryButtonGradient

LOGO GENERATION signals — when detected, respond with confirmation only, NO patch:
- "generate", "create", "make", "design" + "logo" / "icon" / "brand"

RESPONSE EXAMPLES:
User: "make buttons green like SportyBet"
<chat>Updating buttons to SportyBet green.</chat>
<patch>[{"op":"replace","path":"/primary","value":"rgba(37,211,102,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(37,211,102,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(29,168,82,1)"}]</patch>

User: "generate logo for BetKing"
<chat>Generating your BetKing logo now.</chat>

User: "adjust background to match the logo" (with image)
<chat>Matching platform colors to your logo.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(10,13,20,1)"},{"op":"replace","path":"/primary","value":"rgba(253,111,39,1)"}]</patch>

User: "can you change the layout?"
<chat>Layout is configured by your Trivelta team. I can adjust colors and generate brand assets.</chat>`;

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history: Message[];
  logoUrl?: string | null;
  currentColors?: Record<string, string>;
  // legacy compat — old frontend sent { messages, clientId }
  messages?: Message[];
  clientId?: string;
}

/* ── Brand name / image-request detection ────────────────────────────────── */

function extractBrandName(text: string): string | null {
  const patterns = [
    /(?:logo|icon|brand)\s+(?:for\s+)["']?([A-Za-z0-9][A-Za-z0-9\s]{1,30}?)["']?(?:\s*$|[,.])/i,
    /["']([A-Za-z0-9][A-Za-z0-9\s]{1,30}?)["']\s+(?:logo|icon|brand)/i,
    /(?:generate|create|make|design|build)\s+(?:a\s+)?(?:logo|icon)\s+(?:for\s+)?["']?([A-Za-z0-9][A-Za-z0-9\s]{1,30}?)["']?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  // Fallback: PascalCase word not in skip-list
  const SKIP = new Set([
    "Create","Generate","Design","Make","Draw","Build","Give","Need","Want",
    "Logo","Icon","App","Brand","Mark","Show","My","The","Your","Our",
  ]);
  for (const word of text.split(/\s+/)) {
    const clean = word.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 3 && /^[A-Z]/.test(clean) && !SKIP.has(clean)) return clean;
  }
  return null;
}

function detectImageRequest(text: string): { kind: "logo" | "icon"; brandName: string | null } | null {
  const lower = text.toLowerCase();
  const wantsCreate = /\b(create|generate|design|make|draw|build|give me|need|want|show me)\b/.test(lower);
  const isLogo = /\blogo\b|\bbrand mark\b|\bwordmark\b|\bbrand image\b/.test(lower);
  const isIcon = /\bapp icon\b|\bicon\b|\bfavicon\b/.test(lower);
  if (!wantsCreate || (!isLogo && !isIcon)) return null;
  return { kind: isLogo ? "logo" : "icon", brandName: extractBrandName(text) };
}

function isLogoContext(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("logo") ||
    lower.includes("match") ||
    lower.includes("adjust") ||
    lower.includes("background") ||
    lower.includes("color")
  );
}

/* ── Image generation: Ideogram V2 (primary) ────────────────────────────── */

async function generateWithIdeogram(
  brandName: string,
  kind: "logo" | "icon",
  style: string,
  apiKey: string,
): Promise<string | null> {
  const prompt = kind === "icon"
    ? `Professional app icon for iGaming sports betting platform "${brandName}". Bold iconic design, dark background, ${style} accent colors, no text, suitable for iOS/Android.`
    : `Professional iGaming sports betting logo for "${brandName}". Brand name "${brandName}" written clearly in bold modern font. Dark background, ${style} color scheme, vector illustration, clean professional look for mobile app.`;

  try {
    const resp = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          model: "V_2",
          magic_prompt_option: "AUTO",
          style_type: "DESIGN",
          negative_prompt: "blurry text, misspelled text, wrong brand name, distorted letters, amateur design, low quality",
          aspect_ratio: kind === "icon" ? "ASPECT_1_1" : "ASPECT_16_9",
        },
      }),
    });

    if (!resp.ok) {
      console.warn("[studio-chat] Ideogram", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    return (data?.data?.[0]?.url as string) ?? null;
  } catch (e) {
    console.warn("[studio-chat] Ideogram fetch error:", e);
    return null;
  }
}

/* ── Image generation: DALL-E 3 (fallback) ──────────────────────────────── */

async function generateWithDallE(
  brandName: string,
  kind: "logo" | "icon",
  apiKey: string,
): Promise<{ url: string | null; error: string | null }> {
  const brand = brandName ?? "the brand";
  const prompt = kind === "icon"
    ? `Professional app icon for iGaming sports betting platform called ${brand}. Square composition, bold and iconic, vibrant colors, no text, suitable for iOS/Android home screen.`
    : `Professional iGaming sports betting logo. Brand name "${brand}" displayed prominently in bold clear text. Dark navy background, modern vector design, orange or gold accent colors, clean professional appearance.`;

  const size = kind === "logo" ? "1792x1024" : "1024x1024";
  console.log(`[studio-chat] DALL-E 3 fallback, brand="${brand}", size=${size}`);

  try {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality: "hd",
        style: "vivid",
        response_format: "url",
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`[studio-chat] DALL-E ${resp.status}:`, body);
      return { url: null, error: `Image generation failed (${resp.status})` };
    }
    const data = await resp.json();
    const imageUrl: string | undefined = data.data?.[0]?.url;
    return imageUrl ? { url: imageUrl, error: null } : { url: null, error: "No URL in response." };
  } catch (e) {
    return { url: null, error: `Network error: ${String(e)}` };
  }
}

/* ── Generate logo: Ideogram → DALL-E fallback ───────────────────────────── */

async function generateLogo(
  brandName: string | null,
  kind: "logo" | "icon",
  style: string,
  ideogramKey: string | undefined,
  openaiKey: string | undefined,
): Promise<{ url: string | null; error: string | null }> {
  const brand = brandName ?? "the brand";

  if (ideogramKey) {
    console.log(`[studio-chat] Ideogram primary, brand="${brand}"`);
    const url = await generateWithIdeogram(brand, kind, style, ideogramKey);
    if (url) return { url, error: null };
    console.warn("[studio-chat] Ideogram failed — falling back to DALL-E");
  }

  if (openaiKey) {
    return generateWithDallE(brand, kind, openaiKey);
  }

  return { url: null, error: "No image generation API key configured." };
}

/* ── Main handler ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  const OPENAI_API_KEY    = Deno.env.get("OPENAI_API_KEY");
  const IDEOGRAM_API_KEY  = Deno.env.get("IDEOGRAM_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    console.error("[studio-chat] ANTHROPIC_API_KEY missing — add it in Supabase Edge Function secrets");
    return new Response(
      JSON.stringify({ error: "AI service not configured. Contact your administrator." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const body: RequestBody = await req.json();

  // Support both new format { message, history } and legacy { messages }
  const userMessage: string = body.message ?? (body.messages?.slice(-1)[0]?.content ?? "");
  const history: Message[]  = body.history ?? body.messages?.slice(0, -1) ?? [];
  const logoUrl: string | null = body.logoUrl ?? null;

  const imageReq = detectImageRequest(userMessage);

  // Detect style hint for Ideogram
  const msgLower = userMessage.toLowerCase();
  const logoStyle = msgLower.includes("green") ? "green and gold"
    : msgLower.includes("blue") ? "blue and silver"
    : msgLower.includes("red") ? "red and white"
    : msgLower.includes("purple") ? "purple and gold"
    : "orange and gold";

  // Start logo generation immediately in parallel with Claude
  const imagePromise: Promise<{ url: string | null; error: string | null }> =
    imageReq
      ? generateLogo(imageReq.brandName, imageReq.kind, logoStyle, IDEOGRAM_API_KEY, OPENAI_API_KEY)
      : Promise.resolve({ url: null, error: null });

  // Build Claude message content — attach logo image when available and relevant
  const shouldPassImage = !!logoUrl && isLogoContext(userMessage) && !imageReq;

  const userContent: Array<Record<string, unknown>> = [];
  if (shouldPassImage) {
    userContent.push({ type: "image", source: { type: "url", url: logoUrl } });
  }
  userContent.push({ type: "text", text: userMessage });

  const claudeMessages: Array<{ role: string; content: unknown }> = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: shouldPassImage ? userContent : userMessage },
  ];

  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            stream: true,
            system: SYSTEM_PROMPT,
            messages: claudeMessages,
          }),
        });

        if (!claudeResp.ok) {
          send({ type: "error", message: await claudeResp.text() });
          controller.close();
          return;
        }

        // ── XML stream-parsing state machine ──────────────────────────────
        // States: before_chat → in_chat → after_chat → in_patch
        type State = "before_chat" | "in_chat" | "after_chat" | "in_patch";
        let state: State = "before_chat";
        let patchContent = "";
        let pending = "";

        function processText(chunk: string, final = false) {
          pending += chunk;
          let looped = true;
          while (looped) {
            looped = false;
            if (state === "before_chat") {
              const idx = pending.indexOf("<chat>");
              if (idx !== -1) { pending = pending.slice(idx + 6); state = "in_chat"; looped = true; }
              else if (final) pending = "";
              else if (pending.length > 6) pending = pending.slice(pending.length - 6);
            } else if (state === "in_chat") {
              const idx = pending.indexOf("</chat>");
              if (idx !== -1) {
                const tok = pending.slice(0, idx);
                if (tok) send({ type: "token", text: tok });
                pending = pending.slice(idx + 7);
                state = "after_chat";
                looped = true;
              } else {
                const safeEnd = final ? pending.length : Math.max(0, pending.length - 7);
                if (safeEnd > 0) {
                  send({ type: "token", text: pending.slice(0, safeEnd) });
                  pending = pending.slice(safeEnd);
                }
              }
            } else if (state === "after_chat") {
              const idx = pending.indexOf("<patch>");
              if (idx !== -1) { pending = pending.slice(idx + 7); state = "in_patch"; looped = true; }
              else if (final) pending = "";
              else if (pending.length > 7) pending = pending.slice(pending.length - 7);
            } else if (state === "in_patch") {
              const idx = pending.indexOf("</patch>");
              if (idx !== -1) {
                patchContent = pending.slice(0, idx).trim();
                pending = "";
                // Don't change state — we're done
              }
              // else: accumulate
            }
          }
        }

        // Read Claude SSE stream
        const reader = claudeResp.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop()!;
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                processText(evt.delta.text);
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }
        processText("", true); // flush

        // Send validated patch if Claude produced one
        if (patchContent) {
          try {
            const ops = JSON.parse(patchContent);
            if (Array.isArray(ops) && ops.length > 0) {
              const validOps = ops.filter(
                (op: Record<string, unknown>) =>
                  op.op === "replace" &&
                  typeof op.path === "string" &&
                  ALLOWED_PATCH_PATHS.has(op.path) &&
                  typeof op.value === "string" &&
                  RGBA_RE.test((op.value as string).trim()),
              );
              if (validOps.length > 0) send({ type: "patch", ops: validOps });
            }
          } catch (e) {
            console.error("[studio-chat] Patch parse error:", e, patchContent.slice(0, 200));
          }
        }

        // Image generation
        if (imageReq) {
          send({ type: "generating", message: `Generating ${imageReq.kind}...`, estimated_seconds: 15 });
          const imgResult = await imagePromise;
          send({
            type: "image",
            imageUrl: imgResult.url,
            imageType: imageReq.kind,
            imageError: imgResult.error,
          });
        }

        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: String(err) });
      }

      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

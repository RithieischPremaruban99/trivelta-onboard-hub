// Edge Function: studio-chat (streaming SSE)
// Claude Sonnet 4 with Vision for logo analysis.
// Ideogram V2 primary for logo generation; DALL-E 3 fallback.
// XML state machine streams <chat> tokens live, buffers <patch> until complete.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_PATCH_PATHS = new Set([
  // CORE BRAND
  "/primaryBg", "/primary", "/secondary",
  "/primaryButton", "/primaryButtonGradient",
  // BOX GRADIENT
  "/boxGradient1", "/boxGradient2",
  // TEXT
  "/lightText", "/placeholderText", "/navbarLabel", "/textSecondary", "/darkTextColor",
  // HEADER
  "/headerGradient1", "/headerGradient2",
  // WIN / LOSS
  "/wonGradient1", "/wonGradient2", "/wonColor", "/lostColor",
  "/payoutWonColor", "/lossAmountText",
  "/winStatusGradient1", "/winStatusGradient2",
  "/loseStatusGradient1", "/loseStatusGradient2",
  // BUTTONS & INACTIVE
  "/inactiveButtonBg", "/inactiveButtonText", "/inactiveButtonTextSecondary",
  "/inactiveTabUnderline",
  // BACKGROUNDS
  "/dark", "/darkContainer", "/betcardHeaderBg", "/modalBackground",
  "/notificationBg", "/freeBetBackground", "/bgColor",
  "/flexBetHeaderBg", "/flexBetFooterBg",
  // MISC
  "/vsColor", "/borderAndGradientBg", "/activeSecondaryGradient",
]);

const RGBA_RE = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;

/* ── System prompt (context-injected per request) ────────────────────────── */

interface RequestContext {
  clientName?: string;
  currentColors?: Record<string, string>;
  hasLogo?: boolean;
  hasIcon?: boolean;
  isLocked?: boolean;
  platform?: string;
  recentChange?: string | null;
  clientId?: string;
}

function buildSystemPrompt(ctx: RequestContext): string {
  const clientName = ctx.clientName ?? "the client";
  const primary    = ctx.currentColors?.primary    ?? "not set";
  const primaryBg  = ctx.currentColors?.primaryBg  ?? "not set";
  const hasLogo    = ctx.hasLogo ? "Yes" : "No";

  const lockedNote = ctx.isLocked
    ? "\n\nDESIGN IS LOCKED: If the user asks about changes, respond: 'Your design is locked. Contact your Account Manager to make changes.'"
    : "";

  const recentNote = ctx.recentChange
    ? `\n\nRECENT CHANGE: You just updated ${ctx.recentChange}. Consider proactively suggesting a complementary change if it would improve the overall design coherence.`
    : "";

  return `You are a senior platform design consultant at Trivelta iGaming. You are helping ${clientName} configure the visual identity of their sports betting platform.

CURRENT PLATFORM STATE:
- Primary color: ${primary}
- Background: ${primaryBg}
- Has logo: ${hasLogo}
- Platform: Sports betting / iGaming

YOUR ROLE:
You are like a senior designer who knows exactly what makes a successful iGaming brand. You understand the African sports betting market (Nigeria, Ghana, Kenya) and know what designs convert well. You give confident, specific recommendations.

PERSONALITY:
- Direct and confident, like a senior designer
- You make specific recommendations, not vague suggestions
- You reference real iGaming brands when relevant (Bet9ja, SportyBet, BetKing, 1xBet)
- You explain WHY a color choice works, not just what it is
- Maximum 2 sentences. No emojis. No em dashes. Plain text.

OUTPUT FORMAT — ALWAYS exactly this structure:
<chat>
[1-2 sentences. Direct. Professional. Reference why it works if relevant.]
</chat>
<patch>
[RFC 6902 JSON Patch. Only if colors change. Omit entirely if no color change.]
</patch>

ALLOWED PATCH PATHS — core set (AI should only touch brand-visible colors):
/primaryBg /primary /secondary /primaryButton /primaryButtonGradient
/boxGradient1 /boxGradient2 /headerGradient1 /headerGradient2
/lightText /placeholderText /wonGradient1 /wonGradient2
/wonColor /lostColor /inactiveButtonBg /activeSecondaryGradient

COLOR VALUES: rgba(R,G,B,1) integers 0-255 only.

IIGAMING COLOR INTELLIGENCE:
Bet9ja orange = rgba(255,107,0,1) — high conversion in Nigeria
SportyBet green = rgba(0,163,108,1) — trust signal
BetKing gold/orange = rgba(253,111,39,1) — premium feel
1xBet blue = rgba(0,94,172,1) — European market
Betway blue-green = rgba(0,134,195,1) — professional/established
Dark pro background = rgba(10,13,20,1) — industry standard
Premium dark = rgba(8,8,15,1) — luxury feel

WHEN IMAGE IS PROVIDED (logo analysis):
- Analyze dominant colors in the image
- Extract: primary brand color, background color, accent color
- Output matching platform color changes as a patch

FEW-SHOT EXAMPLES (follow these exactly):

User: I want it to look like Bet9ja
<chat>Applying Bet9ja's signature orange. It performs well in the Nigerian market because of strong brand recognition.</chat>
<patch>[{"op":"replace","path":"/primary","value":"rgba(255,107,0,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(255,107,0,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(220,80,0,1)"}]</patch>

User: make it darker
<chat>Deepening the background to a near-black navy. Standard across premium iGaming platforms.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(8,8,15,1)"}]</patch>

User: adjust colors to match my logo (with image)
<chat>I can see your logo uses deep navy and gold. Applying those as your platform's primary colors.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(10,14,35,1)"},{"op":"replace","path":"/primary","value":"rgba(212,175,55,1)"}]</patch>

User: generate a logo for BetKing
<chat>Generating your BetKing logo now.</chat>

User: can you change the layout
<chat>Layout is optimized by your Trivelta team for conversion. I can adjust colors and generate brand assets.</chat>

User: what color should I use for Nigeria?
<chat>Orange dominates the Nigerian market. Bet9ja and SportyBet both use it. I can apply a proven Nigerian palette now if you'd like.</chat>

User: make buttons green
<chat>Updated to SportyBet green. Want me to also update the gradient to create a richer effect?</chat>
<patch>[{"op":"replace","path":"/primaryButton","value":"rgba(0,163,108,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(0,130,85,1)"}]</patch>

RESTRICTIONS:
- Animations: respond with 'Animations are built by your Trivelta team based on your brand. Use the Animations panel on the left to preview placeholders.'
- Features/layout: respond with 'Layout is managed by your Trivelta team. I handle colors and brand assets.'${lockedNote}${recentNote}`;
}

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history: Message[];
  logoUrl?: string | null;
  context?: RequestContext;
  // legacy compat
  currentColors?: Record<string, string>;
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
    : `Professional iGaming sports betting logo. Brand name "${brandName}" in large bold clear text. Dark background. ${style} accent colors. Modern vector design.`;

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
          model: "V_2_TURBO",
          magic_prompt_option: "OFF",
          style_type: "DESIGN",
          negative_prompt: "blurry text, wrong spelling, misspelled name, distorted letters",
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

/* ── Persist generated image to Supabase Storage ────────────────────────── */

async function persistImage(imageUrl: string, clientId: string): Promise<string> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Fetch image ${imageResponse.status}`);
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `${clientId}/logo-${Date.now()}.png`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const uploadResp = await fetch(
      `${supabaseUrl}/storage/v1/object/studio-assets/${fileName}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: imageBuffer,
      },
    );

    if (!uploadResp.ok) {
      const err = await uploadResp.text();
      console.warn("[studio-chat] Storage upload failed:", err);
      return imageUrl; // fall back to ephemeral URL
    }

    return `${supabaseUrl}/storage/v1/object/public/studio-assets/${fileName}`;
  } catch (e) {
    console.warn("[studio-chat] persistImage error:", e);
    return imageUrl; // fall back gracefully
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

  // Merge context — prefer explicit context object, fall back to top-level legacy fields
  const ctx: RequestContext = {
    ...body.context,
    currentColors: body.context?.currentColors ?? body.currentColors,
    clientId: body.context?.clientId ?? body.clientId ?? "unknown",
  };
  const clientId: string = ctx.clientId ?? "unknown";

  const systemPrompt = buildSystemPrompt(ctx);

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

  // Build Claude message content — attach logo image when available and relevant.
  // Only use stable Supabase Storage URLs (ephemeral CDN URLs expire and break Vision).
  const isStableLogoUrl = !!logoUrl && logoUrl.includes("/storage/v1/object/public/");
  const shouldPassImage = isStableLogoUrl && isLogoContext(userMessage) && !imageReq;

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
        // Signal immediately that the server has received the request
        send({ type: "thinking" });

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
            system: systemPrompt,
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

        // Image generation — persist to stable Supabase Storage URL before sending
        if (imageReq) {
          send({ type: "generating", message: `Generating ${imageReq.kind}...`, estimated_seconds: 15 });
          const imgResult = await imagePromise;
          let stableUrl: string | null = imgResult.url;
          if (stableUrl) {
            stableUrl = await persistImage(stableUrl, clientId);
          }
          send({
            type: "image",
            imageUrl: stableUrl,
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

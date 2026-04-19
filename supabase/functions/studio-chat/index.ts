// Edge Function: studio-chat (streaming SSE)
// Streams Claude response as SSE, parsing <chat>/<patch> XML on the fly.
// DALL-E runs in parallel with Claude. <chat> tokens stream to client immediately;
// <patch> content is buffered and sent as a single validated event after Claude finishes.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a platform design consultant at Trivelta iGaming. You configure the visual identity of sports betting platforms.

OUTPUT FORMAT - MANDATORY - no exceptions:
<chat>
[Maximum 1-2 sentences. Plain text. Zero emojis. Zero em dashes. Zero markdown. Zero asterisks.]
</chat>
<patch>
[RFC 6902 JSON Patch array ONLY if colors changed. Omit entirely otherwise.]
</patch>

ALLOWED PATCH PATHS - ONLY these 13:
/primaryBg /primary /secondary /primaryButton /primaryButtonGradient
/wonGradient1 /wonGradient2 /boxGradient1 /boxGradient2
/headerGradient1 /headerGradient2 /lightText /placeholderText

VALUES: rgba(R,G,B,1) format only. Integer values 0-255.

COLOR MAPPING (use these exact values):
orange/amber = rgba(253,111,39,1)
green like WhatsApp = rgba(37,211,102,1)
blue like Telegram = rgba(0,136,204,1)
red = rgba(220,38,38,1)
dark background = rgba(10,13,20,1)
gold = rgba(212,175,55,1)
purple = rgba(124,58,237,1)

LOGO GENERATION:
Extract the EXACT brand name verbatim from the user message.
BetKing stays BetKing. Never change it.
Output: <chat>Generating your [ExactBrandName] logo.</chat>
No <patch> for logo requests.

CONFIRMED CHANGE:
Output: <chat>Done. [One sentence max describing what changed.]</chat>

RESTRICTION:
If asked about layout or features: <chat>Layout is managed by your Trivelta team. I can adjust colors and generate brand assets.</chat>`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  clientId: string;
}

/* ── Brand name extraction ───────────────────────────────────────────────── */

function extractBrandName(text: string): string | null {
  // Primary: required regex pattern - "logo/icon for BrandName" or "logo/icon BrandName"
  const primary = text.match(/(?:logo|icon)\s+(?:for\s+)?([A-Z][a-zA-Z0-9]+)/i);
  if (primary) return primary[1];
  // Quoted brand name
  const quoted = text.match(/["']([A-Za-z0-9 _-]{1,40})["']/);
  if (quoted) return quoted[1].trim();
  // After trigger keywords
  const afterKeyword = text.match(
    /\b(?:for|called|named|brand|company|platform|app)\s+([A-Z][A-Za-z0-9]{1,30}(?:\s[A-Z][A-Za-z0-9]{1,20})?)/,
  );
  if (afterKeyword) return afterKeyword[1].trim();
  // Fallback: any PascalCase word
  const SKIP = new Set(["Create","Generate","Design","Make","Draw","Build","Give","Need","Want","Logo","Icon","App","Brand","Mark"]);
  for (const w of text.split(/\s+/)) {
    const clean = w.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 3 && /^[A-Z]/.test(clean) && !SKIP.has(clean)) return clean;
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

/* ── DALL-E image generation ─────────────────────────────────────────────── */

async function generateImage(
  brandName: string | null,
  kind: "logo" | "icon",
  openaiKey: string,
): Promise<{ url: string | null; error: string | null }> {
  const brand = brandName ?? "the brand";
  const styled =
    kind === "logo"
      ? `Professional iGaming sports betting logo, clean vector design, transparent background, brand name ${brand} in bold modern font, suitable for mobile app`
      : `Professional app icon for an iGaming sports betting platform called ${brand}. Square composition, bold and iconic, vibrant colors, no text, suitable for iOS/Android home screen.`;

  const size = kind === "logo" ? "1792x1024" : "1024x1024";
  console.log(`[studio-chat] Generating ${kind} via DALL-E 3, brand="${brand}", size=${size}`);

  let resp: Response;
  try {
    resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: styled,
        n: 1,
        size,
        quality: "hd",
        style: "vivid",
        response_format: "url",
      }),
    });
  } catch (fetchErr) {
    console.error("[studio-chat] DALL-E network error:", String(fetchErr));
    return { url: null, error: `Network error: ${String(fetchErr)}` };
  }

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`[studio-chat] DALL-E ${resp.status}:`, body);
    return { url: null, error: `Image generation failed (${resp.status})` };
  }

  const data = await resp.json();
  const imageUrl: string | undefined = data.data?.[0]?.url;
  if (!imageUrl) {
    console.error("[studio-chat] DALL-E response missing url field");
    return { url: null, error: "Image generation returned no URL." };
  }
  console.log("[studio-chat] DALL-E image URL received");
  return { url: imageUrl, error: null };
}

/* ── Main handler ────────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body: RequestBody = await req.json();
  const { messages } = body;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const imageReq = lastUser ? detectImageRequest(lastUser.content) : null;

  if (imageReq && !openaiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured - add it in Supabase Edge Function secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Start DALL-E immediately in parallel with Claude (detected from user message)
  const imagePromise: Promise<{ url: string | null; error: string | null }> =
    imageReq && openaiKey
      ? generateImage(imageReq.brandName, imageReq.kind, openaiKey)
      : Promise.resolve({ url: null, error: null });

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
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 512,
            stream: true,
            system: SYSTEM_PROMPT,
            messages,
          }),
        });

        if (!claudeResp.ok) {
          send({ type: "error", message: await claudeResp.text() });
          controller.close();
          return;
        }

        // ── XML stream-parsing state machine ─────────────────────────────
        // States: before_chat -> in_chat -> after_chat -> in_patch
        type State = "before_chat" | "in_chat" | "after_chat" | "in_patch";
        let state: State = "before_chat";
        let patchContent = "";
        let pending = ""; // chars not yet safely emitted (waiting for tag boundary)

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
              }
              // else: accumulate more
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

        // Send validated patch if present
        if (patchContent) {
          try {
            const ops = JSON.parse(patchContent);
            if (Array.isArray(ops) && ops.length > 0) {
              send({ type: "patch", ops });
            }
          } catch (e) {
            console.error("[studio-chat] Patch parse error:", e, patchContent.slice(0, 200));
          }
        }

        // If image was requested, notify client that generation is in progress
        // (DALL-E started in parallel with Claude, so it may still be running)
        if (imageReq) {
          send({ type: "generating", message: `Generating ${imageReq.kind}...`, estimated_seconds: 15 });
        }

        // Wait for DALL-E (likely already running or done)
        const imgResult = await imagePromise;
        if (imgResult.url || imgResult.error) {
          send({
            type: "image",
            imageUrl: imgResult.url,
            imageType: imageReq?.kind ?? "logo",
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

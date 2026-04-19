// Edge Function: studio-chat
// Sends messages to Claude for theme config changes,
// and detects logo/icon generation requests to call DALL-E 3.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a platform design configurator for Trivelta iGaming. Help the user design their platform's visual theme.

When colors change, output a JSON block at the very end of your message (after your text) in this exact format:
\`\`\`json
{
  "primaryBg": "rgba(...)",
  "primary": "rgba(...)"
}
\`\`\`

Only include the keys that actually changed. Valid keys are:
- primaryBg (main background color)
- primary (main brand/accent color)
- secondary (secondary accent, often used for live indicators)
- primaryButton (button background)
- primaryButtonGradient (button gradient end color)
- wonGradient1 (win/success green start)
- wonGradient2 (win/success green end, can be semi-transparent)
- boxGradient1 (box highlight gradient start)
- boxGradient2 (box highlight gradient end)
- headerBorder1 (card/panel background)
- headerBorder2 (deeper panel background)
- lightText (primary text color)
- placeholder (muted/secondary text color)
- inactiveButton (inactive state color)

All values must be valid rgba() strings, e.g. "rgba(253, 111, 39, 1)".

Understand natural language color descriptions:
- "green buttons" → use a vivid green like rgba(34, 197, 94, 1) for primaryButton
- "blue theme" → set primary to something like rgba(59, 130, 246, 1)
- "dark purple background" → set primaryBg to rgba(15, 10, 30, 1)
- If the user gives a hex color like #ff6b35, convert it to rgba format

Be conversational, enthusiastic, and explain what you changed and why it looks good.

NEVER suggest layout changes, feature additions, navigation changes, or anything outside colors and branding.
If asked about layout or features, say: "Layout is optimized by Trivelta's design team for maximum conversion. I can help you customize the colors and branding to match your vision!"

LOGO/ICON GENERATION:
If the user asks you to create, generate, design, or make a logo, app icon, or brand mark, you do NOT need to describe it in text. Just acknowledge briefly (e.g. "Generating your logo now…") — a separate image generator handles the actual creation. Do NOT include a JSON color block when the request is purely about logo/icon generation.

If the user's request doesn't require any color changes (e.g., they're just chatting), omit the JSON block entirely.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  clientId: string;
}

/* ── Image-request detection ─────────────────────────────────────────────── */

function detectImageRequest(text: string): { kind: "logo" | "icon"; prompt: string } | null {
  const lower = text.toLowerCase();
  const wantsCreate = /\b(create|generate|design|make|draw|build|give me|need|want)\b/.test(lower);
  const isLogo = /\blogo\b|\bbrand mark\b|\bwordmark\b/.test(lower);
  const isIcon = /\bapp icon\b|\bicon\b|\bfavicon\b/.test(lower);
  if (!wantsCreate || (!isLogo && !isIcon)) return null;
  return { kind: isLogo ? "logo" : "icon", prompt: text };
}

async function generateImage(userPrompt: string, kind: "logo" | "icon"): Promise<string | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) return null;

  const styled =
    kind === "logo"
      ? `Modern, clean vector-style brand logo for an iGaming/sports betting app. ${userPrompt}. Centered composition, solid contrasting background, bold and memorable, professional brand mark, high contrast, no text artifacts, no watermark.`
      : `Modern app icon for an iGaming/sports betting mobile app. ${userPrompt}. Square format, rounded composition, bold iconic shape, vibrant colors, professional, glossy finish, no text, suitable for iOS/Android home screen.`;

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: styled,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
    }),
  });

  if (!resp.ok) {
    console.error("DALL-E error:", await resp.text());
    return null;
  }

  const data = await resp.json();
  return data.data?.[0]?.url ?? null;
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

    // Detect image request from latest user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const imageReq = lastUser ? detectImageRequest(lastUser.content) : null;

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

    const imagePromise = imageReq ? generateImage(imageReq.prompt, imageReq.kind) : Promise.resolve(null);

    const [claudeResp, imageUrl] = await Promise.all([claudePromise, imagePromise]);

    if (!claudeResp.ok) {
      const err = await claudeResp.text();
      return new Response(JSON.stringify({ error: err }), {
        status: claudeResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await claudeResp.json();
    const text: string = data.content?.[0]?.text ?? "";

    // Extract JSON config block from the response
    let config: Record<string, string> | null = null;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        config = JSON.parse(jsonMatch[1]);
      } catch {
        config = null;
      }
    }

    // Strip the JSON block from the displayed text
    const cleanText = text.replace(/```json[\s\S]*?```/, "").trim();

    return new Response(
      JSON.stringify({
        text: cleanText,
        config,
        image: imageUrl ? { url: imageUrl, kind: imageReq?.kind ?? "logo" } : null,
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

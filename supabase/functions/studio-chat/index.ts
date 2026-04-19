// Edge Function: studio-chat
// Sends messages to Claude for theme configuration, and calls DALL-E 3
// when Claude signals a logo or icon should be generated.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a platform design configurator for Trivelta iGaming. Help the user design their platform's visual theme and branding.

== COLOR CHANGES ==
When colors change, output a JSON block at the very end of your message in this exact format:
\`\`\`json
{
  "primaryBg": "rgba(...)",
  "primary": "rgba(...)"
}
\`\`\`
Only include keys that actually changed. Valid color keys:
primaryBg, primary, secondary, primaryButton, primaryButtonGradient,
wonGradient1, wonGradient2, boxGradient1, boxGradient2,
headerBorder1, headerBorder2, lightText, placeholder, inactiveButton.
All color values must be valid rgba() strings.

Understand natural language: "green buttons" → rgba(34,197,94,1) for primaryButton, etc.

== LOGO / ICON GENERATION ==
When the user asks to generate, create, design, or make a logo OR an app icon, include a JSON block like this (instead of a color block):
\`\`\`json
{
  "_generateImage": "logo",
  "_brandPrompt": "A professional sports betting platform logo for [brand name]. Bold modern wordmark, [color] accent, dark background. Clean minimal design, no cluttered elements."
}
\`\`\`
- Use "_generateImage": "logo" for logos/wordmarks (wide format)
- Use "_generateImage": "icon" for app icons/favicons (square format)
- "_brandPrompt" must be a detailed DALL-E 3 prompt. Include brand name if mentioned, color scheme from context, and style direction from user.
- For logos: emphasize horizontal wordmark, bold typography, iGaming aesthetic
- For icons: emphasize square composition, single bold symbol or letter, works at small size
- DALL-E 3 cannot produce true transparency, so suggest the user can remove the background after downloading.

== RESTRICTIONS ==
NEVER suggest layout changes, feature additions, or navigation changes.
If asked about layout or features: "Layout is optimized by Trivelta's design team for maximum conversion — I can help with colors and branding!"

If nothing changes (just chatting), omit the JSON block entirely.`;

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ApiMessage[];
  clientId: string;
}

interface ImageResult {
  url: string;
}

async function generateImage(
  prompt: string,
  size: "1024x1024" | "1792x1024",
  openaiKey: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "hd",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DALL-E 3 error: ${err}`);
  }

  const data = await response.json();
  const result = data.data?.[0] as ImageResult | undefined;
  if (!result?.url) throw new Error("No image URL returned from DALL-E 3");
  return result.url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages }: RequestBody = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 1. Call Claude ───────────────────────────────────────────────────────
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return new Response(JSON.stringify({ error: err }), {
        status: claudeRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeData = await claudeRes.json();
    const rawText: string = claudeData.content?.[0]?.text ?? "";

    // ── 2. Parse JSON config block ───────────────────────────────────────────
    let parsedConfig: Record<string, string> | null = null;
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsedConfig = JSON.parse(jsonMatch[1]);
      } catch {
        parsedConfig = null;
      }
    }

    // Strip the JSON block from displayed text
    const cleanText = rawText.replace(/```json[\s\S]*?```/, "").trim();

    // ── 3. Handle image generation request ──────────────────────────────────
    let imageUrl: string | null = null;
    let imageType: "logo" | "icon" | null = null;
    let colorConfig: Record<string, string> | null = null;

    if (parsedConfig && parsedConfig._generateImage) {
      imageType = parsedConfig._generateImage as "logo" | "icon";
      const brandPrompt = parsedConfig._brandPrompt ?? "A professional iGaming sports betting platform logo. Bold modern typography, dark background, vibrant accent colors.";

      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY not configured — add it in Supabase Edge Function secrets" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const size = imageType === "logo" ? "1792x1024" : "1024x1024";
      imageUrl = await generateImage(brandPrompt, size, openaiKey);

      // Don't pass _generateImage keys as color config
      colorConfig = null;
    } else if (parsedConfig) {
      // Regular color config — filter out any accidental _ keys
      colorConfig = Object.fromEntries(
        Object.entries(parsedConfig).filter(([k]) => !k.startsWith("_")),
      );
      if (Object.keys(colorConfig).length === 0) colorConfig = null;
    }

    return new Response(
      JSON.stringify({
        text: cleanText,
        config: colorConfig,
        imageUrl,
        imageType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

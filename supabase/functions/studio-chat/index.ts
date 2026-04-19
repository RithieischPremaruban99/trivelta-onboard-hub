// Edge Function: studio-chat
// Sends messages to Claude and extracts theme config changes.

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

If the user's request doesn't require any color changes (e.g., they're just chatting), omit the JSON block entirely.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  clientId: string;
}

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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
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

    return new Response(JSON.stringify({ text: cleanText, config }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

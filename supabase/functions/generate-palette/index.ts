/**
 * Edge Function: generate-palette
 *
 * Translates a natural-language brand description into a complete TCMPalette
 * (344 fields) via Claude Sonnet 4.
 *
 * POST /functions/v1/generate-palette
 * Body: { brandPrompt, language?, logoUrl?, currentPalette?, manualOverrides?, regenerationFeedback? }
 */

import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";
import {
  DEFAULT_TCM_PALETTE,
  type TCMPalette,
} from "../_shared/tcm-palette.ts";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Fixed fields — AI must not change these
// ---------------------------------------------------------------------------

const PAM_FIXED_FIELDS: (keyof TCMPalette)[] = [
  "pamChartCanceledBg",
  "pamChartExpiredBg",
  "pamChartPendingReviewBg",
  "pamChartVerifiedBg",
  "pamChartActiveBg",
  "pamChartFailedBg",
  "pamChartNotVerifiedBg",
  "pamChartPurchaseBg",
  "pamChartWithdrawalsBg",
  "pamChartRevenueBg",
  "pamChartSportsradarBg",
  "pamChartDstBg",
  "pamChartAcceptedBg",
  "pamChartRejectedBg",
  "pamChartPrizeRedemptionsBg",
  "pamScrollbarThumbColor",
  "pamScrollbarBg",
];

const GAMEPASS_GOLD_FIXED_FIELDS: (keyof TCMPalette)[] = [
  "gamepassGoldGradient1",
  "gamepassGoldGradient2",
  "gamepassGoldGradient3",
  "gamepassGoldReverseGradient1",
  "gamepassGoldReverseGradient2",
];

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Marcus, a senior iGaming brand designer with 10 years of experience across African, European, LATAM, and MENA markets. Your specialty: translating brand descriptions into complete color palettes for sports betting and casino platforms.

═══ OUTPUT FORMAT — STRICT ═══

Return ONLY valid JSON. No markdown fences. No prose outside JSON. Schema:

{
  "palette": { ...only fields that deviate from default... },
  "reasoning": "2-3 sentences explaining your choices",
  "keyColorsSummary": "1-2 short punchy sentences naming the key colors applied (e.g. 'Applied SportyBet signature red on a dark charcoal base, with green win indicators and red loss states.')"
}

Output ONLY the fields that should deviate from the default palette for this brand. Return a JSON object containing just the changed fields. Do not include fields that match the default. The system will automatically fill unchanged fields from the default palette.

Minimum required fields you MUST always include:
- primary
- primaryBackgroundColor
- secondary
- lightTextColor
- textSecondaryColor
- wonColor (must be green family)
- lostColor (must be red family)
- wonGradient1, wonGradient2
- primaryButton, primaryButtonGradient
- dark, darkContainerBackground
- headerBorderGradient1, headerBorderGradient2
- activeSecondaryGradientColor
- inactiveButtonBg

All other fields: include only if you have a specific brand-driven reason to change them from default. Expect to output 60-150 fields total, not 344.

Every rgba() string: valid format, alpha between 0 and 1.

═══ BRAND FACTS — VERIFIED, NEVER INVENT ═══

If user mentions any of these operators, use these EXACT primary colors:

- Bet365: primary #027B5B (green), accent #F9DC1C (yellow), #FFFFFF
- DraftKings: primary #61B510 (crown green), #000000, accent #F46C22 (orange)
- FanDuel: primary #1493FF (Dodger blue), accent #0F8000 (green), #0A0A0A
- Betway: primary #000000 (black), green #00A826 sparingly
- Bet9ja: primary #009A3E (green), #FFFFFF, yellow accent
- SportyBet: primary #E30613 (red — NOT GREEN, common AI mistake), #FFFFFF, silver
- 1xBet: primary #1A6DC2 (blue), accent #0E8A3C (green), #FFFFFF
- Betano: primary #FF6A00 (orange), #000000, #FFFFFF
- BetKing: primary #E30613 (red), #000000, gold accents
- Premier Bet: primary #FFCC00 (yellow), #000000, red accents
- Odibets: primary #00A651 (green), #FFFFFF, yellow accent
- SportPesa: primary #1A2E8E (deep blue), #FFFFFF, red accent
- Caesars: #000000 primary, #C9A34E gold, #FFFFFF
- BetMGM: primary #BFA046 (gold/bronze), #000000
- Betika: primary #00A651 (green), #FFFFFF
- Hollywoodbets: primary #522D80 (purple), #FFFFFF

If user mentions operator NOT in list, respond in reasoning: "I don't have verified brand data for [X]. Using the visual description provided." Then proceed with best interpretation.

═══ SEMANTIC COLOR GRAMMAR — SACRED, NEVER VIOLATE ═══

These UI semantics are non-negotiable even if user requests otherwise. If user says "make wonColor red", push back in reasoning but STILL keep semantic correct:

WIN FAMILY (must be green, hue 90°-160°):
- wonColor, wonGradient1, wonGradient2, payoutWonColor, wonGradiantP2p
- slantingLinesWon, winStatusGradient1/2/3
- winStatusBorderGradient1/2/3, winStatusP2pGradient1/2
- successIconP2p, validGradient, successBlurLayer
- successInputGrad1/2, cashoutSuccessBgGrad1/2
- profitLineColor, profitLineGradColor, passwordStrongColor
- completeChallengeBtnShadow, completeChallengeBtnBorderGrad1-4
- monthlyChallengeGrad1/2, purchaseSuccessBorder
- purchaseSuccessCardBoxStyle1/2, accentGreenSecondary
- oddsLiveButtonBorderGrad1/2, liveIncreaseOddsButtonShadows1-3
- liveEventIncreaseColorPalette1/2, actionIconBoxBg
- betStatusWinGradient1/2, betFeedWonGradient1/2, wonBorderGradColors1/2
- pikkemWonColor, pikkemSuccessBg, pikkemSuccessBorderColor

LOSS FAMILY (must be red, hue 340°-20°):
- lostColor, lostStatusColor, lossAmountText
- loseStatusGradient1/2/3, loseStatusBorderGradient1/2/3
- loseStatusP2pGradient1/2, lostBorderGrad1/2
- errorBlurLayer, weakPassword, captionAndErrorTxt
- slantingLinesLost, iconBorderShadow, commentSectionBorder
- errorGradient1/2, purchaseErrorCardShadow1/2
- responseModalBgLayerGradEnd, referralCloseIconColor
- liveEventDecreaseColorPalette1/2, liveEventDecreaseBorderColorPalette1/2/3
- cancelBorderGradient1/2/3, iconBackgroundGrad1/2
- betStatusLoseGradient1/2, reportModalGradient1/2
- pokerLiveChatCountBorderColor, pokerFoldButtonGradient1-5
- pikkemLostColor, pikkemErrorBg, pikkemErrorBorderColor

═══ MARKET INTELLIGENCE ═══

| Market | Background | Primary | Reference |
|--------|------------|---------|-----------|
| Nigeria | rgba(10,13,20,1) | rgba(255,107,0,1) | Bet9ja Orange |
| Nigeria Alt | rgba(8,8,11,1) | rgba(227,6,19,1) | SportyBet Red |
| Ghana | rgba(8,12,8,1) | rgba(0,166,81,1) | Betway Green |
| Kenya | rgba(8,8,11,1) | rgba(227,6,19,1) | SportyBet Red (dominant leader) |
| Kenya Alt | rgba(26,46,142,1) | rgba(255,255,255,1) | SportPesa Blue |
| Ivory Coast | rgba(8,10,14,1) | rgba(0,166,81,1) | Francophone Green |
| Brazil | rgba(10,20,10,1) | rgba(255,127,0,1) | Warm orange |
| Mexico | rgba(10,15,20,1) | rgba(0,134,195,1) | Blue/red |
| MENA/Arabic | rgba(15,20,30,1) | rgba(191,160,70,1) | Gold — AVOID green for gambling (religious sensitivity) |
| Europe | rgba(8,8,15,1) | rgba(192,192,192,1) | Silver Premium |
| VIP/Luxury | rgba(8,8,15,1) | rgba(212,175,55,1) | Gold |
| Aggressive | rgba(10,5,5,1) | rgba(220,38,38,1) | Red Energy |

═══ COLOR DERIVATION RULES ═══

When generating 344 fields from a brand description, apply these heuristics to maintain internal consistency:

1. BACKGROUND LADDER (from brand primary background):
   - primaryBackgroundColor: user-specified or market default
   - dark: primaryBackgroundColor +3% lightness
   - darkContainerBackground: +5-8% lightness
   - modalBackground: +2% lightness
   - bgColor: rgba(0,0,0,1) if bg is near-black, else primaryBackgroundColor
   - inputBackgroundColor: darkContainerBackground +1-3%
   - betcardHeaderBg: dark +2%
   - flexBetHeaderBg: darkContainerBackground
   - flexBetFooterBg: warm tint if primary is warm
   - notificationSectionBg: primaryBackgroundColor +4%
   - freeBetBackground: primary with 12% alpha over dark

2. TEXT LADDER:
   - lightTextColor: rgba(255,255,255,1) for dark bg
   - textSecondaryColor: lightTextColor at 63% alpha
   - textInputPlaceholderText: lightTextColor at 57% alpha
   - navbarLabel: lightTextColor at 86% alpha
   - darkTextColor: rgba(54,54,54,1) for light surfaces
   - chatMessageTextColor: warm tint of lightText if brand is warm

3. GRADIENTS:
   - boxGradientColorStart → boxGradientColorEnd: primary → accent or primary → complementary
   - headerBorderGradient1 → headerBorderGradient2: darkContainer → dark (subtle tonal shift)
   - primaryButton → primaryButtonGradient: primary → primary+15% lightness, -10° hue

4. BUTTONS:
   - inactiveButtonBg: primary at low saturation + low lightness (if primary is orange → dark brown)
   - inactiveButtonTextPrimary: desaturated primary, 70% lightness
   - inactiveButtonTextSecondary: inactiveButtonTextPrimary at 40% alpha
   - inactiveTabUnderline: neutral gray rgba(128,128,128,1) OR neutralized brand
   - activeSecondaryGradientColor: bright accent (yellow if warm brand, cyan if cool)

5. FEATURE-SPECIFIC DERIVATIONS:
   - Poker Fold buttons: red family derived from lostColor
   - Poker Check/Call/Raise: green/yellow/gold (use defaults — these are conventions)
   - Gamepass Gold gradients: FIXED, brand-independent — always rgba(179,123,47,1) → rgba(249,210,103,1)
   - PAM Admin Panel: FIXED, brand-independent — NEVER change these from defaults. They are admin panel utility colors used internally.
   - Casino Card Layers: primaryBackgroundColor with decreasing alpha
   - Pikkem colors: semantic (won=green, lost=red), bg is gold-ish default

═══ ACCESSIBILITY CONSTRAINTS ═══

- Ensure WCAG AA contrast (4.5:1) between lightTextColor and primaryBackgroundColor. If user request would violate, adjust lightTextColor and note in reasoning.
- Do NOT generate palettes where wonColor and primary are indistinguishable (both green-ish).
- Do NOT make primaryBackgroundColor red — red is reserved for loss/error states.

═══ CONSTRAINT PRESERVATION ═══

If the input message contains manualOverrides array + currentPalette:
- Those specific field values MUST appear EXACTLY unchanged in your output palette
- Derive all other fields to harmonize around the locked values
- Mention in reasoning: "Preserved N manual overrides as constraints"

If regenerationFeedback is provided:
- Treat it as a refinement instruction
- Adjust ONLY the field families relevant to the feedback
- Preserve unrelated fields as much as possible
- Example: "make primary more red" → adjust primary + primaryButton + primaryButtonGradient + inactive family + boxGradient if affected, but keep wonColor/lostColor/text/backgrounds/PAM untouched

═══ RESPONSIBLE GAMBLING ═══

- Do NOT generate pulsing/alarm-red backgrounds
- Do NOT make deposit button colors indistinguishable from safer-gambling link colors
- Responsible gambling colors should be neutral-gray or navy, NEVER bright red or orange

═══ GENERATE NOW ═══

User will now describe their brand. Generate a complete 344-field palette.`;

// ---------------------------------------------------------------------------
// RGBA validator
// ---------------------------------------------------------------------------

const RGBA_RE = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;

function isValidRgba(value: unknown): value is string {
  return typeof value === "string" && RGBA_RE.test(value.trim());
}

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

interface GeneratePaletteRequest {
  brandPrompt: string;
  language?: "en" | "fr" | "pt" | "sw" | "yo" | "ha" | "ar";
  logoUrl?: string;
  currentPalette?: TCMPalette;
  manualOverrides?: string[];
  regenerationFeedback?: string;
}

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface GeneratePaletteResponse {
  palette: TCMPalette;
  reasoning: string;
  keyColorsSummary: string;
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// Build user message
// ---------------------------------------------------------------------------

function buildUserMessage(req: GeneratePaletteRequest): string {
  const parts: string[] = [];

  parts.push(`BRAND DESCRIPTION:\n${req.brandPrompt}`);

  if (req.language) {
    parts.push(`TARGET LANGUAGE: ${req.language}`);
  }

  if (req.logoUrl) {
    parts.push(`LOGO URL FOR REFERENCE: ${req.logoUrl}`);
  }

  if (req.currentPalette) {
    parts.push(
      `CURRENT PALETTE (for iteration):\n${JSON.stringify(req.currentPalette, null, 2)}`
    );
  }

  if (req.manualOverrides && req.manualOverrides.length > 0 && req.currentPalette) {
    const overrideLines = req.manualOverrides
      .map((f) => `${f}: ${(req.currentPalette as Record<string, string>)[f] ?? "(unknown)"}`)
      .join("\n");
    parts.push(`MANUAL OVERRIDES (MUST PRESERVE EXACTLY):\n${overrideLines}`);
  }

  if (req.regenerationFeedback) {
    parts.push(`REFINEMENT REQUEST: ${req.regenerationFeedback}`);
  }

  parts.push("\nGenerate the complete JSON now.");

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Parse AI response — with one retry on JSON parse failure
// ---------------------------------------------------------------------------

async function streamAnthropic(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  model: string,
  temperature: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const streamStart = Date.now();
  console.log(`[generate-palette] Starting stream with model: ${model}`);

  let accumulated = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = client.messages.stream({
    model,
    max_tokens: 16000,
    temperature,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      accumulated += event.delta.text;
    } else if (event.type === "message_start") {
      inputTokens = event.message.usage?.input_tokens ?? 0;
    } else if (event.type === "message_delta") {
      outputTokens = event.usage?.output_tokens ?? outputTokens;
    }
  }

  const elapsedMs = Date.now() - streamStart;
  console.log(
    `[generate-palette] Stream completed in ${elapsedMs}ms, total chars: ${accumulated.length}`
  );

  return { text: accumulated, inputTokens, outputTokens };
}

async function callAnthropicWithRetry(
  client: Anthropic,
  userMessage: string,
  model: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const first = await streamAnthropic(client, messages, model, 0.7);

  // Try parse — if fails, retry once with corrective instruction
  try {
    JSON.parse(first.text);
    return first;
  } catch {
    console.error(
      `[generate-palette] JSON parse failed. First 500 chars:`,
      first.text.slice(0, 500)
    );
    console.log("[generate-palette] JSON parse failed on first attempt, retrying");

    const retryMessages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
      { role: "assistant", content: first.text },
      {
        role: "user",
        content:
          "Your last response was not valid JSON. Return ONLY valid JSON with no markdown fences, no extra prose. Start your response with { and end with }.",
      },
    ];

    const retry = await streamAnthropic(client, retryMessages, model, 0.3);

    return {
      text: retry.text,
      inputTokens: first.inputTokens + retry.inputTokens,
      outputTokens: first.outputTokens + retry.outputTokens,
    };
  }
}

// ---------------------------------------------------------------------------
// Validate + enforce palette
// ---------------------------------------------------------------------------

const MIN_REQUIRED_FIELDS: (keyof TCMPalette)[] = [
  "primary",
  "primaryBackgroundColor",
  "secondary",
  "lightTextColor",
  "textSecondaryColor",
  "wonColor",
  "lostColor",
  "wonGradient1",
  "wonGradient2",
  "primaryButton",
  "primaryButtonGradient",
  "dark",
  "darkContainerBackground",
  "headerBorderGradient1",
  "headerBorderGradient2",
  "activeSecondaryGradientColor",
  "inactiveButtonBg",
];

function validateAndEnforce(
  raw: Record<string, unknown>,
  req: GeneratePaletteRequest,
  warnings: string[]
): TCMPalette {
  const palette = { ...DEFAULT_TCM_PALETTE } as TCMPalette;
  const allKeys = Object.keys(DEFAULT_TCM_PALETTE) as (keyof TCMPalette)[];

  let aiProvidedCount = 0;
  let invalidCount = 0;

  for (const key of allKeys) {
    const aiValue = raw[key];
    if (aiValue === undefined || aiValue === null) {
      // Missing — silently fill from default (expected normal path)
      continue;
    }
    if (!isValidRgba(aiValue)) {
      invalidCount++;
      warnings.push(
        `Field "${key}" has invalid value "${String(aiValue).slice(0, 40)}", replaced with default`
      );
      continue;
    }
    (palette as Record<string, string>)[key] = aiValue as string;
    aiProvidedCount++;
  }

  // Warn if any required field missing or invalid
  for (const key of MIN_REQUIRED_FIELDS) {
    const v = raw[key];
    if (v === undefined || v === null || !isValidRgba(v)) {
      warnings.push(`Required field "${key}" missing or invalid — using default`);
    }
  }

  console.log(
    `[generate-palette] AI provided ${aiProvidedCount} valid fields, ${invalidCount} invalid, ${344 - aiProvidedCount} filled from defaults`
  );

  // PAM enforcement
  let pamResets = 0;
  for (const key of PAM_FIXED_FIELDS) {
    const defaultVal = DEFAULT_TCM_PALETTE[key];
    if ((palette as Record<string, string>)[key] !== defaultVal) {
      (palette as Record<string, string>)[key] = defaultVal;
      pamResets++;
    }
  }
  if (pamResets > 0) {
    console.log(`[generate-palette] Enforced ${pamResets} PAM admin panel fields to defaults`);
  }

  // Gamepass Gold enforcement
  let gpResets = 0;
  for (const key of GAMEPASS_GOLD_FIXED_FIELDS) {
    const defaultVal = DEFAULT_TCM_PALETTE[key];
    if ((palette as Record<string, string>)[key] !== defaultVal) {
      (palette as Record<string, string>)[key] = defaultVal;
      gpResets++;
    }
  }
  if (gpResets > 0) {
    console.log(`[generate-palette] Enforced ${gpResets} Gamepass Gold fields to defaults`);
  }

  // Manual overrides enforcement
  if (req.manualOverrides && req.manualOverrides.length > 0 && req.currentPalette) {
    let overrideResets = 0;
    for (const field of req.manualOverrides) {
      const key = field as keyof TCMPalette;
      if (key in DEFAULT_TCM_PALETTE) {
        const requiredVal = (req.currentPalette as Record<string, string>)[field];
        if (requiredVal && (palette as Record<string, string>)[key] !== requiredVal) {
          (palette as Record<string, string>)[key] = requiredVal;
          overrideResets++;
        }
      }
    }
    if (overrideResets > 0) {
      warnings.push(
        `${overrideResets} manual override field(s) restored to locked values`
      );
    }
  }

  return palette;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

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

  const startMs = Date.now();

  // ── API key check ──────────────────────────────────────────────────────────
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("[generate-palette] ANTHROPIC_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Server misconfigured", detail: "Missing ANTHROPIC_API_KEY" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: GeneratePaletteRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── Validate required fields ───────────────────────────────────────────────
  if (!body.brandPrompt || typeof body.brandPrompt !== "string") {
    return new Response(
      JSON.stringify({ error: "brandPrompt is required and must be a string" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  if (body.brandPrompt.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: "brandPrompt cannot be empty" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
  if (body.brandPrompt.length > 500) {
    return new Response(
      JSON.stringify({ error: "brandPrompt must be 500 characters or fewer" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const validLanguages = ["en", "fr", "pt", "sw", "yo", "ha", "ar"];
  if (body.language && !validLanguages.includes(body.language)) {
    return new Response(
      JSON.stringify({ error: `language must be one of: ${validLanguages.join(", ")}` }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── Log request metadata ───────────────────────────────────────────────────
  console.log(
    `[generate-palette] Request: prompt_length=${body.brandPrompt.length}, ` +
    `has_current_palette=${!!body.currentPalette}, ` +
    `overrides_count=${body.manualOverrides?.length ?? 0}`
  );

  // ── Build Anthropic client ─────────────────────────────────────────────────
  const client = new Anthropic({ apiKey });

  // Primary model: claude-sonnet-4-20250514 (verified)
  // Fallback: claude-3-5-sonnet-20241022
  const PRIMARY_MODEL = "claude-sonnet-4-20250514";
  const FALLBACK_MODEL = "claude-3-5-sonnet-20241022";

  const userMessage = buildUserMessage(body);
  let aiText: string;
  let inputTokens: number;
  let outputTokens: number;
  let usedModel = PRIMARY_MODEL;

  // ── Call Anthropic ─────────────────────────────────────────────────────────
  try {
    console.log(
      `[generate-palette] Anthropic call: model=${PRIMARY_MODEL}, ` +
      `tokens_in≈${Math.round(userMessage.length / 4)}`
    );
    const result = await callAnthropicWithRetry(client, userMessage, PRIMARY_MODEL);
    aiText = result.text;
    inputTokens = result.inputTokens;
    outputTokens = result.outputTokens;
  } catch (err: unknown) {
    // If primary model fails, try fallback
    const errMsg = err instanceof Error ? err.message : String(err);
    const isModelError =
      errMsg.includes("model") ||
      errMsg.includes("not found") ||
      errMsg.includes("invalid_request");

    if (isModelError) {
      console.warn(`[generate-palette] Primary model failed, trying fallback`);
      console.warn(
        `[generate-palette] Primary model ${PRIMARY_MODEL} failed (${errMsg}), falling back to ${FALLBACK_MODEL}`
      );
      usedModel = FALLBACK_MODEL;
      try {
        const result = await callAnthropicWithRetry(client, userMessage, FALLBACK_MODEL);
        aiText = result.text;
        inputTokens = result.inputTokens;
        outputTokens = result.outputTokens;
      } catch (fallbackErr: unknown) {
        const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error("[generate-palette] Fallback model also failed:", fbMsg);
        return new Response(
          JSON.stringify({ error: "Upstream AI error", detail: fbMsg }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.error("[generate-palette] Anthropic API error:", errMsg);
      return new Response(
        JSON.stringify({ error: "Upstream AI error", detail: errMsg }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
  }

  // ── Parse JSON response ────────────────────────────────────────────────────
  let parsed: {
    palette: Record<string, unknown>;
    reasoning: string;
    keyColorsSummary: string;
  };

  try {
    parsed = JSON.parse(aiText);
  } catch {
    console.error("[generate-palette] AI response could not be parsed after retry. First 500 chars:", aiText.slice(0, 500));
    return new Response(
      JSON.stringify({
        error: "AI response could not be parsed",
        detail: "Response was not valid JSON after retry",
      }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  if (!parsed.palette || typeof parsed.palette !== "object") {
    return new Response(
      JSON.stringify({ error: "AI response missing palette object" }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // ── Validate + enforce palette ─────────────────────────────────────────────
  const warnings: string[] = [];
  const palette = validateAndEnforce(parsed.palette, body, warnings);

  const durationMs = Date.now() - startMs;
  const fieldsFromDefault = warnings.filter(
    (w) => w.includes("missing from AI") || w.includes("invalid value")
  ).length;

  console.log(
    `[generate-palette] Response: model=${usedModel}, tokens_out=${outputTokens}, ` +
    `fields_filled_from_default=${fieldsFromDefault}, warnings=${warnings.length}, ` +
    `duration_ms=${durationMs}`
  );

  // ── Build response ─────────────────────────────────────────────────────────
  const response: GeneratePaletteResponse = {
    palette,
    reasoning:
      typeof parsed.reasoning === "string"
        ? parsed.reasoning
        : "Palette generated from brand description.",
    keyColorsSummary:
      typeof parsed.keyColorsSummary === "string" && parsed.keyColorsSummary.trim().length > 0
        ? parsed.keyColorsSummary
        : "Palette applied — check the preview on the right.",
    ...(warnings.length > 0 && { warnings }),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});

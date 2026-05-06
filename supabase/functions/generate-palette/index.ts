/**
 * Edge Function: generate-palette
 *
 * Translates a natural-language brand description into a complete TCMPalette
 * (344 fields) via Claude Sonnet 4.6 with extended thinking + vision logo input.
 *
 * POST /functions/v1/generate-palette
 * Body: { brandPrompt, language?, logoUrl?, currentPalette?, manualOverrides?, regenerationFeedback? }
 */

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.40.0?target=deno";
import {
  DEFAULT_TCM_PALETTE,
  type TCMPalette,
} from "../_shared/tcm-palette.ts";
import { makeCorsHeaders } from "../_shared/cors.ts";

// ---------------------------------------------------------------------------
// Fixed fields - AI must not change these
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

const SYSTEM_PROMPT = `You are the Trivelta Assistant, a senior iGaming brand designer with 10 years of experience across African, European, LATAM, and MENA markets. Your specialty: translating brand descriptions into complete color palettes for sports betting and casino platforms.

═══ OUTPUT FORMAT - STRICT ═══

STREAMING FORMAT: Write 1-2 sentences of brand reasoning as plain text on the FIRST line. Then on a new line, output ONLY the raw JSON object starting with {. No markdown fences. No other prose.

JSON schema (starts on line 2):
{
  "palette": { ...only fields that deviate from default... },
  "reasoning": "same 2-3 sentences (also inside JSON for compatibility)",
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

═══ LANGUAGE MATCHING ═══

ALWAYS respond in the language of the user's verbs and pronouns, not by
counting words. Brand names, hex codes, and single English vocabulary
words ("style", "vibe", "look", "premium", "modern", "casino") are
language-neutral and DO NOT count when classifying language.

CLASSIFICATION RULES (in order):

1. Look at the user's VERB and PRONOUN. If they are German ("gib", "mach",
   "ich will", "ich brauche", "kannst du"), the message is GERMAN — even
   if surrounded by English brand names or English style words.

   Examples:
     "gib mir caliente style"        → German (verb "gib" + pronoun "mir")
     "mach mir eine palette"         → German (verb "mach" + pronoun "mir")
     "ich brauche bet365 vibe"       → German (pronoun "ich" + verb "brauche")
     "kannst du sportybet machen"    → German (verb "kannst" + pronoun "du")

2. Same rule for Spanish: verbs like "hazme", "dame", "quiero", "puedes",
   "necesito", "haz" + their pronouns.

   Examples:
     "hazme una paleta como bet365"  → Spanish (verb "hazme")
     "dame caliente style"           → Spanish (verb "dame")
     "quiero algo morado premium"    → Spanish (verb "quiero")

3. Same rule for French: verbs like "fais-moi", "donne-moi", "je veux",
   "peux-tu", "j'ai besoin".

   Examples:
     "fais-moi une palette"          → French
     "donne-moi un style bet365"     → French

4. Same rule for Portuguese: "faz", "dá-me", "quero", "preciso", "podes".

   Examples:
     "faz uma palheta tipo bet365"   → Portuguese
     "quero algo roxo premium"       → Portuguese

5. Only if there are NO clear non-English verbs/pronouns, fall back to
   English.

WHAT DOES NOT MATTER for classification:

- Brand names (Caliente, Bet365, SportyBet, Hollywoodbets) — language-neutral
- Hex codes and rgba() values
- Single English style words: "style", "vibe", "look", "feel", "premium",
  "modern", "casino", "sports", "betting", "luxury", "dark"
- Field names ("primary", "secondary", "background")

This rule is STRICT. Do not "average out" or weight by word count. The
presence of even ONE clear German verb-pronoun pair like "gib mir" makes
the entire message German.

RESPONSE LANGUAGE applies to:
  - The reasoning text (the pre-JSON line and the "reasoning" field)
  - The keyColorsSummary field
  - Any conversational responses (mode: "conversational")

RESPONSE LANGUAGE does NOT apply to:
  - Hex color values (always in hex format)
  - Field names in the palette JSON (always English: "primary", etc.)
  - Verified operator names (Caliente.mx, Bet365 stay as proper nouns)

IMPORTANT: Keep the designer-voice rules from RESPONSE QUALITY STANDARDS
even when responding in non-English languages. The banned marketing
adjectives apply in ALL languages — do not write "feurig" (German for
fiery), "ardiente" (Spanish for fiery), "fougueux" (French for fiery)
either. Match the spirit of the rules in the user's language.

Example of good German response (input: "gib mir caliente style"):
  "Caliente.mx verwendet als Primary #E30613 — ein klares Rot, kein
  Orange. Diesen exakten Wert habe ich übernommen und auf einen fast
  schwarzen Hintergrund (#1A1A1A) mit weißem Text gesetzt. Gold (#FFCC00)
  als dezenter Akzent nimmt den mexikanischen Markt-Bezug auf, ohne die
  Rot-dominierte Identität zu überladen."

Example of good Spanish response (input: "hazme caliente style"):
  "Apliqué el primary verificado de Caliente.mx (#E30613) sobre fondo
  casi negro (#1A1A1A) con texto blanco. El amarillo (#FFCC00) como
  acento mantiene el guiño mexicano sin saturar la identidad roja."

═══ WHEN TO RESPOND CONVERSATIONALLY (NO PALETTE) ═══

Some user messages are NOT brand-design requests. They include:
- Questions about your capabilities ("what can you do?", "how does this work?")
- Requests for recommendations or advice without a specific brand
  ("what colors are popular in Nigeria?", "any tips?", "what would you suggest?")
- Meta questions about the product, the platform, or the design process
- Greetings, thanks, or unclear messages
- Requests to explain a previous palette decision

For these messages, respond with this JSON shape on the first line of output
(no pre-text, just the JSON):

  {"mode": "conversational", "message": "...your helpful answer (2-5 sentences)..."}

Do NOT include a "palette" field in conversational responses. Do NOT invent
a palette to satisfy the format. The system handles conversational mode
separately.

When you're confident the user IS describing a brand (mentions a name,
mentions colors/vibe, refers to a market, says "make me a palette"), use
the normal palette generation format.

When in doubt, prefer conversational mode and ask a clarifying question.
It's better to ask "Sport-focused, casino, or both? Mass-market or premium?"
than to guess.

═══ OPERATOR BRAND REFERENCES ═══

When the user references a specific operator (Bet365, SportyBet, Caliente, Hollywoodbets, Stake, BetWay, Pixbet, Codere, Betano, 1xBet, Tipico, Ladbrokes, William Hill, Bet9ja, etc.) — DO NOT invent or guess hex values. Operator brand colors vary across markets and update over time; hardcoded values risk being wrong.

Instead, respond with this pattern:

"I don't have verified hex values for [Brand]. To match their exact identity, upload their logo to Brand Assets — I'll extract the colors directly from the image. Meanwhile, here's a palette inspired by their general direction: [generate inspired palette in 1 sentence describing the visual direction, then full palette]."

This applies to ALL operator names, no exceptions. Logo upload is the reliable path to brand-exact palettes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGO HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your capability: you generate color palettes. A separate specialised system handles logo generation.

If the user's request is PURELY about creating a logo (e.g. "create a logo", "generate a logo for X"), the request will be routed to the logo system BEFORE reaching you - so you won't normally see pure logo requests.

If the user's request is MIXED (e.g. "create a logo AND colors for BetNova"), respond normally with a palette - the logo system handles the logo in parallel. In your reasoning, mention that you've applied the palette and that logo generation is being handled separately.

If the user asks to MODIFY an existing logo (e.g. "make my logo more red"), respond in reasoning that logo modifications happen via: (a) regenerating the palette to shift surrounding colors to match the logo, or (b) asking for a new logo generation or uploading a different logo in Brand Assets.

If a logo image is provided visually: analyse its dominant colors, gradients, and overall aesthetic to inform your palette choices. Extract the key brand colors directly from the image and build the full palette around them.

═══ SEMANTIC COLOR GRAMMAR - SACRED, NEVER VIOLATE ═══

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
| MENA/Arabic | rgba(15,20,30,1) | rgba(191,160,70,1) | Gold - AVOID green for gambling (religious sensitivity) |
| Europe | rgba(8,8,15,1) | rgba(192,192,192,1) | Silver Premium |
| VIP/Luxury | rgba(8,8,15,1) | rgba(212,175,55,1) | Gold |
| Aggressive | rgba(10,5,5,1) | rgba(220,38,38,1) | Red Energy |

═══ VISUAL HIERARCHY — BRAND COMPOSITION ═══

A brand has ONE primary color. Not two, not three. One that defines the brand identity.

PRIMARY FAMILY (dominant — should appear in all CTAs and major banners):
- primary, primaryButton, primaryButtonGradient
- All call-to-action buttons (Claim, Bet, Sign in, etc.)
- All major banners: freeBetBackground, welcomeBonusBg, bonusBackground
- Active tab indicators, selected states
- Notification highlights

SECONDARY/ACCENT FAMILY (supporting — only 1-2 small UI elements):
- secondary, activeSecondaryGradientColor
- Premium badges, VIP indicators
- Special status pills (e.g., "LIVE", "Hot")

NEUTRAL/BACKGROUND (60-70% of visual surface):
- primaryBackgroundColor, dark, modalBackground, darkContainerBackground
- All container/list/card backgrounds

CRITICAL HIERARCHY RULES:

1. ONE PRIMARY DOMINANT: All call-to-action buttons, all bonus banners, all welcome offer backgrounds use the primary color or gradients derived from primary. Do NOT use secondary/accent color for major banners — that breaks brand hierarchy.

2. ACCENT IS RARE: Secondary/accent appears in 1-2 small UI elements only. Should NEVER dominate freeBetBackground, welcomeBonusBg, or any major surface.

3. WHEN USER SAYS "X primary with Y accent":
   - X = primary → all CTAs, banners, dominant surfaces use X
   - Y = accent → only in small targeted elements (badges, win states if Y is gold/green)

   Example: "purple-black with gold accent"
   ✓ Buttons purple, free-bet banner purple gradient, welcome banner purple, gold only in VIP badge
   ✗ Buttons purple BUT free-bet banner gold AND welcome banner gold AND CTAs gold — this elevates gold to co-primary, breaking hierarchy

4. BANNER FAMILY DERIVATION:
   - freeBetBackground: primary with 12% alpha over dark, OR primary-to-darker-primary gradient
   - welcomeBonusBg: primary at 70% saturation as solid OR primary gradient
   - bonusBackground (if exists): primary-derived
   - These banners are HEROES of the page — they MUST reinforce the primary brand color, not introduce a competing color

5. SELF-CHECK BEFORE SUBMITTING:
   Look at your generated palette. Identify which 3-5 fields will be most visually prominent on the page (buttons, free-bet banner, welcome bonus banner, navigation highlight). Are they ALL in the primary family? If any of them is in a different color family, you've broken hierarchy — fix it before output.

EXAMPLES:

User: "Nigeria casino, premium positioning, deep purple with gold"

Bad output:
- primary: #7C3AED (purple) ✓
- primaryButton: #7C3AED (purple) ✓
- freeBetBackground: #D4AF37 (gold) ✗ — banner is gold, not purple
- welcomeBonusBg: #FFD700 (gold) ✗ — second banner also gold

Good output:
- primary: #7C3AED (purple)
- primaryButton: #7C3AED
- freeBetBackground: rgba(124,58,237,0.15) — purple at 15% alpha over dark
- welcomeBonusBg: linear gradient #5B21B6 → #7C3AED — purple gradient
- secondary: #D4AF37 (gold) — used ONLY in VIP badge or win state

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
   - Poker Check/Call/Raise: green/yellow/gold (use defaults - these are conventions)
   - Gamepass Gold gradients: FIXED, brand-independent - always rgba(179,123,47,1) → rgba(249,210,103,1)
   - PAM Admin Panel: FIXED, brand-independent - NEVER change these from defaults. They are admin panel utility colors used internally.
   - Casino Card Layers: primaryBackgroundColor with decreasing alpha
   - Pikkem colors: semantic (won=green, lost=red), bg is gold-ish default

═══ ACCESSIBILITY CONSTRAINTS ═══

- Ensure WCAG AA contrast (4.5:1) between lightTextColor and primaryBackgroundColor. If user request would violate, adjust lightTextColor and note in reasoning.
- Do NOT generate palettes where wonColor and primary are indistinguishable (both green-ish).
- Do NOT make primaryBackgroundColor red - red is reserved for loss/error states.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRAST GRAMMAR - NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Text must always be readable against its background. For every foreground/background pair below, apply the contrast rule:

If the BACKGROUND is light (gold, yellow, bright green, bright blue, white, cream):
  → Foreground text MUST be dark (near-black, dark charcoal, deep navy)
If the BACKGROUND is dark (black, charcoal, deep purple, navy):
  → Foreground text MUST be light (white, off-white, light gray)

Apply this to these pairs:
- primaryButton ↔ primaryTextColor
- primaryButtonGradient ↔ primaryTextColor (use same text color as primaryButton)
- secondary ↔ darkTextColor
- wonGradient1/2 ↔ lightTextColor
- loseStatusGradient1/2 ↔ lightTextColor
- inactiveButtonBg ↔ inactiveButtonTextPrimary
- freeBetBackground ↔ primaryTextColor
- modalBackground ↔ lightTextColor
- notificationSectionBg ↔ lightTextColor

Common violation to avoid: Generating gold/yellow primaryButton WITH gold primaryTextColor. This is unreadable. Use dark text on light buttons, always.

If user explicitly requests a monochrome look (e.g. 'all gold' or 'pure dark'), still apply contrast to text - the rule is absolute for readability.

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

═══ RESPONSE QUALITY STANDARDS — DESIGNER VOICE, NOT MARKETING VOICE ═══

Your reasoning is read by a brand owner reviewing your work. They are a
designer or operator, not a copywriter. Speak like a senior designer
explaining a decision to a peer — concrete, specific, accurate.

HARD RULES — these are non-negotiable:

1. NAME ACTUAL HEX VALUES OR HUE FAMILIES YOU USED.
   Bad:  "I applied a fiery red-orange palette"
   Good: "I used a warm orange (#FF6A00) as primary on a charcoal base (#1A1A1A)"
   Good: "Primary is in the orange-red family (~hue 15°), not pure red"
   If the actual primary you generated is orange, call it orange. If red, call
   it red. Do not call orange "red-orange" or "warm red". Be precise.

2. NEVER USE THESE WORDS in reasoning:
   fiery, passionate, intense, intensity, vibrant (alone), bold (alone),
   dynamic, energetic, captivating, captures, embodies, signature,
   authentic, dominant, dominates, premium feeling, heat, energy,
   atmosphere, excitement, thrill, adrenaline, electrifying, magnetic,
   immersive, evocative, journey, experience (as a noun decoration).

   These are marketing adjectives. They do not describe colors. They
   describe feelings about colors, which is not what designers write.

3. WHEN A USER REFERENCES A VERIFIED OPERATOR (Caliente, Bet365, SportyBet,
   etc.), be explicit about your approach:
   - If you used the operator's exact verified hex values, say so:
     "Caliente uses #E30613 — I applied that exact value as primary."
   - If you interpreted the operator's vibe as inspiration without
     copying their hex, say so:
     "Rather than copying Caliente's red exactly, I shifted to a warm
     orange (#FF6A00) which reads similarly Mexican but feels less
     corporate."
   Either is acceptable — the user asked for "style" not "exact match".
   What is NOT acceptable is pretending you used their colors when you
   didn't.

4. STRUCTURE — for FRESH generation (no existing palette), 4-6 sentences:
   - Sentence 1-2: What primary you chose and why (concrete: hex or hue family + rationale)
   - Sentence 3-4: How the supporting palette (background, accents) builds on that
   - Sentence 5-6 (optional): What you deliberately did NOT do, or one suggestion for refinement

5. STRUCTURE — for REFINEMENT, 2-4 sentences:
   - What changed (concrete: which fields, in what direction)
   - What you preserved
   - One suggestion if useful

EXAMPLES OF GOOD VS BAD REASONING:

BAD (current AI behavior):
"Caliente represents the fiery energy of Mexican sports betting culture
with bold red-orange branding that captures the heat and excitement of
live wagering. I've applied their signature vibrant red-orange as the
primary with deep charcoal backgrounds to create that high-energy,
passionate betting atmosphere."

GOOD (target):
"Caliente.mx uses #E30613 as primary — a clean red, not orange. I
interpreted 'Caliente style' as their vibe rather than exact match, and
chose a warm orange (#FF6A00) primary on charcoal (#1A1A1A) background.
The orange reads as Latin-American sports without being corporate-red. If
you want the exact Caliente identity, ask for 'Caliente palette' and I'll
swap primary to #E30613."

ALSO GOOD (target, exact match path):
"Applied Caliente.mx's verified primary #E30613 on their dark base
#1A1A1A with white text. The button gradient runs from primary to a
slightly lighter red (#F0252C) for depth. Win-state stays standard green
to preserve sports-betting semantics; the brand red is reserved for
primary actions and loss states."

Notice the differences: hex values named, decisions concrete, no
storytelling adjectives, designer-to-designer tone.

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

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeneratePaletteRequest {
  brandPrompt: string;
  language?: "en" | "fr" | "pt" | "sw" | "yo" | "ha" | "ar";
  logoUrl?: string;
  currentPalette?: TCMPalette;
  manualOverrides?: string[];
  regenerationFeedback?: string;
  conversationHistory?: ConversationMessage[];
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
// Fetch logo as base64 for vision input (5s timeout, 4MB cap)
// ---------------------------------------------------------------------------

async function fetchLogoAsBase64(
  url: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      console.warn(`[generate-palette] Logo fetch HTTP ${res.status}, falling back to text`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "image/png";
    const mediaType = contentType.split(";")[0].trim();
    const supportedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!supportedTypes.includes(mediaType)) {
      console.warn(`[generate-palette] Unsupported logo MIME ${mediaType}, falling back to text`);
      return null;
    }
    const buf = await res.arrayBuffer();
    const MAX_BYTES = 4 * 1024 * 1024; // 4MB
    if (buf.byteLength > MAX_BYTES) {
      console.warn(`[generate-palette] Logo too large (${buf.byteLength} bytes), falling back to text`);
      return null;
    }
    // Encode to base64
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    console.log(`[generate-palette] Logo fetched: ${bytes.byteLength} bytes, type=${mediaType}`);
    return { base64, mediaType };
  } catch (e) {
    console.warn(`[generate-palette] Logo fetch failed: ${e instanceof Error ? e.message : e}, falling back to text`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Country detection — conservative, clear references only
// ---------------------------------------------------------------------------

function detectCountryFromPrompt(prompt: string): string | null {
  const countryMap: Array<{ patterns: RegExp[]; iso: string }> = [
    {
      patterns: [/\b(nigeria|nigerian|nigerianisch|naija|lagos|abuja|port harcourt)\b/i],
      iso: "NG",
    },
    {
      patterns: [/\b(mexico|méxico|mexican|mexikan|mexicano|tijuana|monterrey|guadalajara|cdmx|ciudad de mexico)\b/i],
      iso: "MX",
    },
    {
      patterns: [/\b(brazil|brasil|brazilian|brasilien|brasileiro|são paulo|sao paulo|rio de janeiro|salvador)\b/i],
      iso: "BR",
    },
    {
      patterns: [/\b(south africa|südafrika|sudafrica|johannesburg|cape town|durban|pretoria)\b/i],
      iso: "ZA",
    },
    {
      patterns: [/\b(kenya|kenyan|kenia|kenianisch|nairobi|mombasa)\b/i],
      iso: "KE",
    },
  ];

  for (const { patterns, iso } of countryMap) {
    if (patterns.some((p) => p.test(prompt))) return iso;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Market context blocks for 5 priority markets
// ---------------------------------------------------------------------------

function buildMarketContext(iso: string): string | null {
  const contexts: Record<string, string> = {
    NG: `MARKET CONTEXT — NIGERIA:
Dominant visual codes in market: green (Bet9ja, mass-market trust signal), red (SportyBet, BetKing — energy/aggression), blue (1xBet — international sportsbook trust).
Cultural notes: mobile-first is mandatory (>85% of betting traffic). Mass-market positioning skews to bright primary colors. Premium tier is significantly underdeveloped.
Differentiation cues: deep purple, navy with gold accents, monochrome with single bright accent, or teal/sky-blue read as "modern challenger" against the dominant green-red cluster.
Constraints: avoid pure green if the user is positioning as premium (reads mass-market). Avoid red+green combinations (SportyBet/Bet9ja overlap).`,

    MX: `MARKET CONTEXT — MEXICO:
Dominant visual codes in market: red (Caliente — market leader), green (Codere — retail-derived), orange/black (Betano — sports-focused).
Cultural notes: avoid clichéd "Mexican folkloric" references unless specifically requested. Modern professional aesthetics travel better. Spanish-language UI is mandatory.
Differentiation cues: most operators cluster around warm reds and oranges. A premium gold/dark identity, deep purple, or sophisticated muted earth tones break visually from the dominant warm cluster.
Constraints: if user goes for red, push for a distinct shade or composition that doesn't read as Caliente clone.`,

    BR: `MARKET CONTEXT — BRAZIL:
Dominant visual codes in market post-2024 regulation: orange (Betano), green/pink (Pixbet), yellow/black (KTO, Sportingbet), blue (Galera.bet), dark navy/purple (Stake).
Cultural notes: yellow+green as flag-color shorthand is overused. Pix payment integration is universal — palette must support clean payment-CTA distinct from confirmation green.
Differentiation cues: market is saturated with yellow-orange palettes. Cool tones (deep blue, teal, deep purple) visually break through.
Constraints: avoid copying Betano's orange or KTO's yellow unless user explicitly requests those references.`,

    ZA: `MARKET CONTEXT — SOUTH AFRICA:
Dominant visual codes in market: purple+gold (Hollywoodbets, premium positioning — market leader), black+green (Betway, traditional sportsbook), yellow+black (Supabets, mass-market).
Cultural notes: regulated environment with Manufacturing License recently established. Premium positioning is the growth segment, not mass-market.
Differentiation cues: premium tier dominated by Hollywoodbets purple. Differentiation through deep navy+silver, monochrome+single bright accent, or sophisticated warm earth tones reads as distinct.
Constraints: if user wants premium, avoid purple unless they accept being read as Hollywoodbets-adjacent.`,

    KE: `MARKET CONTEXT — KENYA:
Dominant visual codes in market: deep blue (SportPesa, traditional sportsbook), green (Betika, Odibets, mass-market), red (SportyBet, energy).
Cultural notes: M-Pesa integration affects CTA color choice — payment buttons should be visually distinct from M-Pesa green. Mobile-first is dominant.
Differentiation cues: warmer tones (orange, gold) or modern dark palettes (charcoal+single bright accent) read as premium against the dominant deep-blue/green cluster.
Constraints: avoid pure M-Pesa-style green for payment CTAs.`,
  };
  return contexts[iso] ?? null;
}

// ---------------------------------------------------------------------------
// Build user message text (logo handled separately via vision)
// ---------------------------------------------------------------------------

function buildUserMessage(req: GeneratePaletteRequest, logoFetchedViaVision: boolean): string {
  const parts: string[] = [];

  parts.push(`BRAND DESCRIPTION:\n${req.brandPrompt}`);

  // Country-aware market context — silent injection, no prompt to user
  const detectedCountry = detectCountryFromPrompt(req.brandPrompt);
  if (detectedCountry) {
    const marketContext = buildMarketContext(detectedCountry);
    if (marketContext) {
      parts.push(
        `${marketContext}\n\nUse this market context to inform DIFFERENTIATION in your reasoning. Do NOT push the user toward copying market leaders. Mention what makes their brand distinct from the dominant cluster, briefly and naturally — not as a sales pitch.`
      );
    }
  }

  if (req.language) {
    parts.push(`TARGET LANGUAGE: ${req.language}`);
  }

  // Only include logo URL as text if we failed to attach it as a vision image
  if (req.logoUrl && !logoFetchedViaVision) {
    parts.push(`LOGO URL FOR REFERENCE: ${req.logoUrl}`);
  }

  if (req.currentPalette) {
    parts.push(
      `CURRENT PALETTE (for iteration):\n${JSON.stringify(req.currentPalette, null, 2)}`
    );
  }

  if (req.manualOverrides && req.manualOverrides.length > 0 && req.currentPalette) {
    const overrideLines = req.manualOverrides
      .map((f) => `${f}: ${(req.currentPalette as unknown as Record<string, string>)[f] ?? "(unknown)"}`)
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
// streamAnthropic - used for retry path (no thinking, with prompt caching)
// ---------------------------------------------------------------------------

async function streamAnthropic(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  model: string,
  temperature: number,
  systemText: string
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
    system: [
      { type: "text", text: systemText, cache_control: { type: "ephemeral" } },
    ] as Parameters<typeof client.messages.stream>[0]["system"],
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

function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } | null {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!match) return null;
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgba1: string, rgba2: string): number {
  const c1 = parseRgba(rgba1);
  const c2 = parseRgba(rgba2);
  if (!c1 || !c2) return 1;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function pickContrastingText(backgroundRgba: string): string {
  const bg = parseRgba(backgroundRgba);
  if (!bg) return "rgba(255,255,255,1)";
  const lum = relativeLuminance(bg.r, bg.g, bg.b);
  return lum > 0.5 ? "rgba(20,20,25,1)" : "rgba(255,255,255,1)";
}

function enforceContrast(palette: TCMPalette): TCMPalette {
  const contrastPairs: Array<{ bg: keyof TCMPalette; text: keyof TCMPalette }> = [
    { bg: "primaryButton", text: "primaryTextColor" },
    { bg: "freeBetBackground", text: "primaryTextColor" },
    { bg: "inactiveButtonBg", text: "inactiveButtonTextPrimary" },
    { bg: "modalBackground", text: "lightTextColor" },
    { bg: "notificationSectionBg", text: "lightTextColor" },
    { bg: "wonGradient1", text: "lightTextColor" },
    { bg: "loseStatusGradient1", text: "lightTextColor" },
    { bg: "primaryBackgroundColor", text: "lightTextColor" },
  ];

  const MIN_WCAG_AA = 4.5;
  const corrected = { ...palette } as TCMPalette;
  let correctionCount = 0;

  for (const { bg, text } of contrastPairs) {
    const bgColor = corrected[bg] as string;
    const textColor = corrected[text] as string;
    if (!bgColor || !textColor) continue;
    const ratio = contrastRatio(bgColor, textColor);
    if (ratio < MIN_WCAG_AA) {
      const newTextColor = pickContrastingText(bgColor);
      console.log(
        `[generate-palette] Contrast fix: ${text} ${textColor} → ${newTextColor} (${bg}=${bgColor}, ratio was ${ratio.toFixed(2)})`
      );
      (corrected as unknown as Record<string, string>)[text] = newTextColor;
      correctionCount++;
    }
  }

  if (correctionCount > 0) {
    console.log(`[generate-palette] Auto-contrast enforced on ${correctionCount} text field(s)`);
  }

  return corrected;
}

function validateAndEnforce(
  raw: Record<string, unknown>,
  req: GeneratePaletteRequest,
  warnings: string[]
): TCMPalette {
  // For fresh generations, start from defaults so unfilled fields don't bleed
  // from previous brand. For refinements, start from currentPalette so
  // unchanged fields persist (Haiku returns a partial response by design).
  const isRefinement = isSimpleRefinement(req.brandPrompt, !!req.currentPalette);
  const palette = isRefinement
    ? ({ ...(req.currentPalette ?? DEFAULT_TCM_PALETTE) } as TCMPalette)
    : ({ ...DEFAULT_TCM_PALETTE } as TCMPalette);

  console.log(
    `[generate-palette] Palette base: ${isRefinement ? "currentPalette (refinement)" : "DEFAULT_TCM_PALETTE (fresh)"}`
  );
  const allKeys = Object.keys(DEFAULT_TCM_PALETTE) as (keyof TCMPalette)[];

  let aiProvidedCount = 0;
  let invalidCount = 0;

  for (const key of allKeys) {
    const aiValue = raw[key];
    if (aiValue === undefined || aiValue === null) {
      // Missing - silently fill from default (expected normal path)
      continue;
    }
    if (!isValidRgba(aiValue)) {
      invalidCount++;
      warnings.push(
        `Field "${key}" has invalid value "${String(aiValue).slice(0, 40)}", replaced with default`
      );
      continue;
    }
    (palette as unknown as Record<string, string>)[key] = aiValue as string;
    aiProvidedCount++;
  }

  // Warn only if a required field is missing FROM THE FINAL MERGED PALETTE.
  // For refinements, fields not in the AI output are correctly filled from
  // currentPalette and should not trigger false-positive warnings.
  for (const key of MIN_REQUIRED_FIELDS) {
    const finalValue = (palette as unknown as Record<string, string>)[key];
    if (!finalValue || !isValidRgba(finalValue)) {
      warnings.push(`Required field "${key}" missing or invalid - using default`);
    }
  }

  console.log(
    `[generate-palette] AI provided ${aiProvidedCount} valid fields, ${invalidCount} invalid, ${344 - aiProvidedCount} filled from defaults`
  );

  // PAM enforcement
  let pamResets = 0;
  for (const key of PAM_FIXED_FIELDS) {
    const defaultVal = DEFAULT_TCM_PALETTE[key];
    if ((palette as unknown as Record<string, string>)[key] !== defaultVal) {
      (palette as unknown as Record<string, string>)[key] = defaultVal;
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
    if ((palette as unknown as Record<string, string>)[key] !== defaultVal) {
      (palette as unknown as Record<string, string>)[key] = defaultVal;
      gpResets++;
    }
  }
  if (gpResets > 0) {
    console.log(`[generate-palette] Enforced ${gpResets} Gamepass Gold fields to defaults`);
  }

  // Auto-contrast safety net - runs before manual override restoration so user overrides win
  const contrastPalette = enforceContrast(palette);
  (Object.keys(contrastPalette) as (keyof TCMPalette)[]).forEach((k) => {
    (palette as unknown as Record<string, string>)[k] = (contrastPalette as unknown as Record<string, string>)[k];
  });

  // Manual overrides enforcement
  if (req.manualOverrides && req.manualOverrides.length > 0 && req.currentPalette) {
    let overrideResets = 0;
    for (const field of req.manualOverrides) {
      const key = field as keyof TCMPalette;
      if (key in DEFAULT_TCM_PALETTE) {
        const requiredVal = (req.currentPalette as unknown as Record<string, string>)[field];
        if (requiredVal && (palette as unknown as Record<string, string>)[key] !== requiredVal) {
          (palette as unknown as Record<string, string>)[key] = requiredVal;
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

  // DEBUG: verify merged palette has key brand fields populated
  console.log(
    `[generate-palette] Final palette check: primary=${(palette as unknown as Record<string, string>).primary}, ` +
    `primaryButton=${(palette as unknown as Record<string, string>).primaryButton}, ` +
    `secondary=${(palette as unknown as Record<string, string>).secondary}, ` +
    `wasRefinement=${!!req.currentPalette}`
  );

  return palette;
}

// ---------------------------------------------------------------------------
// Haiku routing - detect simple refinements
// ---------------------------------------------------------------------------

function isSimpleRefinement(userPrompt: string, hasExistingPalette: boolean): boolean {
  if (!hasExistingPalette) return false;
  const lower = userPrompt.toLowerCase().trim();
  if (lower.length > 80) return false;
  const refinePatterns = [
    /\b(make|keep|adjust|tweak|change|set|update|fix|ensure|align|match)\b.*\b(darker|lighter|brighter|softer|bolder|warmer|cooler|more|less|smaller|bigger)\b/,
    /\b(darker|lighter|brighter|softer|bolder|warmer|cooler|more|less|too)\b/,
    /\b(contrast|saturation|brightness|hue|tone|shade)\b/,
    /\b(background|text|button|primary|secondary|accent|won|lost)\b.*\b(darker|lighter|brighter|softer|bolder|warmer|cooler|more|less)\b/,
    /^(a bit|slightly|just|only)\b/,
  ];
  return refinePatterns.some((p) => p.test(lower));
}

const REFINEMENT_PREFIX =
  "REFINEMENT MODE: User is making a small adjustment to an existing palette. Return ONLY the fields that need to change - not a full palette. Keep reasoning to 1-2 sentences. Preserve unrelated colors.\n\n";

// Detects whether a fresh-generation brief warrants the full 4000 thinking budget.
// Simple briefs use 2000. Complex signals (any one is sufficient):
//   - Logo URL provided (vision processing needs more reasoning)
//   - Long brief (>= 100 chars suggests multi-constraint)
//   - Verified brand name mentioned (triggers BRAND FACTS lookup)
//   - Multiple constraint connectors in brief
// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = { ...makeCorsHeaders(req), "Access-Control-Allow-Methods": "POST, OPTIONS" };
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

  const requestStartTime = Date.now();

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
    `overrides_count=${body.manualOverrides?.length ?? 0}, ` +
    `has_logo=${!!body.logoUrl}`
  );
  const detectedCountryLog = detectCountryFromPrompt(body.brandPrompt);
  if (detectedCountryLog) {
    console.log(`[generate-palette] Country detected: ${detectedCountryLog}`);
  }

  // ── Fetch logo as vision image (best-effort, 5s, 4MB cap) ─────────────────
  let logoData: { base64: string; mediaType: string } | null = null;
  if (body.logoUrl) {
    logoData = await fetchLogoAsBase64(body.logoUrl);
  }

  // ── Build Anthropic client + model selection ──────────────────────────────
  const client = new Anthropic({
    apiKey,
    defaultHeaders: {
      "anthropic-beta": "interleaved-thinking-2025-05-14,prompt-caching-2024-07-31",
    },
  });

  const PRIMARY_MODEL = "claude-sonnet-4-6";
  const HAIKU_MODEL = "claude-haiku-4-5-20251001";
  const isRefine = isSimpleRefinement(body.brandPrompt, !!body.currentPalette);
  const model = isRefine ? HAIKU_MODEL : PRIMARY_MODEL;
  const isPrimary = model === PRIMARY_MODEL;
  const maxTokens = isRefine ? 2000 : 8000;
  const effectiveSystemPrompt = isRefine ? REFINEMENT_PREFIX + SYSTEM_PROMPT : SYSTEM_PROMPT;
  // Extended thinking requires temperature=1; Haiku uses 0.7
  const temperature = isPrimary ? 1 : 0.7;

  console.log(
    `[generate-palette] Model: ${model} (isRefine=${isRefine}, isPrimary=${isPrimary}, logoVision=${!!logoData})`
  );

  // ── Build user content (text + optional vision image) ─────────────────────
  const userText = buildUserMessage(body, !!logoData);
  type ContentBlock = Anthropic.TextBlockParam | Anthropic.ImageBlockParam;
  const userContent: ContentBlock[] = [{ type: "text", text: userText }];
  if (logoData) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: logoData.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        data: logoData.base64,
      },
    });
    userContent.push({
      type: "text",
      text: "The image above is the brand logo. Analyse its colors and aesthetic to inform the palette.",
    });
  }

  // ── Build messages array - prepend conversation history (last ≤10 turns) ──
  const historyMessages: Anthropic.MessageParam[] = (body.conversationHistory ?? [])
    .slice(-10)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Diagnostic: measure history size
  const historyCharCount = historyMessages.reduce((acc, m) =>
    acc + (typeof m.content === "string" ? m.content.length : 0), 0
  );
  const historyTokenEstimate = Math.ceil(historyCharCount / 4);

  console.log(`[generate-palette] HISTORY_DIAGNOSTIC:`, JSON.stringify({
    turn_count: historyMessages.length,
    total_chars: historyCharCount,
    estimated_tokens: historyTokenEstimate,
    per_message_chars: historyMessages.map((m, i) => ({
      idx: i,
      role: m.role,
      chars: typeof m.content === "string" ? m.content.length : 0,
    })),
    has_currentPalette: !!body.currentPalette,
    brandPrompt_length: body.brandPrompt.length,
    brandPrompt_preview: body.brandPrompt.slice(0, 80),
  }));
  const anthropicMessages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: "user", content: userContent },
  ];

  console.log(
    `[generate-palette] History turns: ${historyMessages.length}, total messages: ${anthropicMessages.length}`
  );

  // ── SSE streaming response ─────────────────────────────────────────────────
  const encoder = new TextEncoder();

  // Cached system block (shared between primary and haiku paths)
  const cachedSystem = [
    { type: "text", text: effectiveSystemPrompt, cache_control: { type: "ephemeral" } },
  ] as Parameters<typeof client.messages.stream>[0]["system"];

  const sseStream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        let accumulated = "";
        let reasoningDone = false;
        let reasoningSentUpTo = 0;
        let firstTokenLogged = false;
        let reasoningDoneLogged = false;
        const tBeforeStream = Date.now();
        console.log(`[generate-palette] T_PRE_STREAM: ${tBeforeStream - requestStartTime}ms (handler setup)`);

        // Build stream params - extended thinking only for primary model
        const streamParams: Parameters<typeof client.messages.stream>[0] = {
          model,
          max_tokens: maxTokens,
          temperature,
          system: cachedSystem,
          messages: anthropicMessages,
          ...(isPrimary && {
            thinking: { type: "enabled", budget_tokens: 4000 },
          }),
        };

        const stream = client.messages.stream(streamParams);

        for await (const event of stream) {
          if (event.type === "content_block_delta") {
            // Extended thinking delta - emit as thinking_chunk
            if ((event.delta as { type: string }).type === "thinking_delta") {
              const thinkingText = (event.delta as { type: string; thinking: string }).thinking ?? "";
              if (thinkingText) {
                send({ type: "thinking_chunk", text: thinkingText });
              }
            } else if (event.delta.type === "text_delta") {
              accumulated += event.delta.text;

              // Stream pre-JSON text as reasoning chunks
              // Skip streaming if response starts with { (conversational JSON or direct JSON)
              if (!reasoningDone && accumulated.trimStart().startsWith("{")) {
                reasoningDone = true;
              }
              if (!reasoningDone) {
                const boundary = accumulated.indexOf("\n{");
                if (boundary !== -1) {
                  // Found JSON boundary - stream anything unsent before it
                  const unsent = accumulated.slice(reasoningSentUpTo, boundary);
                  if (unsent.trim()) send({ type: "reasoning_chunk", text: unsent });
                  reasoningDone = true;
                  reasoningSentUpTo = boundary;
                } else {
                  // Stream up to 2 chars before end to avoid splitting \n{ boundary
                  const safeEnd = Math.max(reasoningSentUpTo, accumulated.length - 2);
                  if (safeEnd > reasoningSentUpTo) {
                    const chunk = accumulated.slice(reasoningSentUpTo, safeEnd);
                    if (chunk) send({ type: "reasoning_chunk", text: chunk });
                    reasoningSentUpTo = safeEnd;
                  }
                }
              }

            }
          }
        }

        // ── Parse accumulated response ───────────────────────────────────────
        // Strip markdown code fences the AI occasionally wraps around JSON
        const trimmed = accumulated.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const boundaryIdx = trimmed.indexOf("\n{");

        let preJsonReasoning = "";
        let jsonText = trimmed;

        if (boundaryIdx !== -1) {
          preJsonReasoning = trimmed.slice(0, boundaryIdx).trim();
          jsonText = trimmed.slice(boundaryIdx + 1).trim();
        }

        let parsed: { palette?: Record<string, unknown>; reasoning?: string; keyColorsSummary?: string; mode?: string; message?: string };

        try {
          parsed = JSON.parse(jsonText);
        } catch {
          // Fallback: try full text as JSON (old format with reasoning inside)
          try {
            parsed = JSON.parse(trimmed);
            preJsonReasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : preJsonReasoning;
          } catch {
            // Last resort: retry with explicit JSON instruction (no thinking on retry)
            console.warn("[generate-palette] JSON parse failed, doing inline retry");
            console.error(
              "[generate-palette] JSON parse failed. Raw output (first 4000 chars):",
              accumulated.substring(0, 4000)
            );
            console.error(
              "[generate-palette] Raw output length:",
              accumulated.length,
              "boundaryIdx:",
              boundaryIdx,
              "preJsonReasoning length:",
              preJsonReasoning.length
            );
            const retryResult = await streamAnthropic(
              client,
              [
                ...historyMessages,
                { role: "user", content: userContent },
                { role: "assistant", content: accumulated },
                {
                  role: "user",
                  content:
                    "Your last response was not valid JSON because it contained markdown code fences (```). Output the JSON directly, starting with { and ending with }. NO ``` blocks anywhere in your response. NO prose before or after. Just raw JSON.",
                },
              ],
              model,
              0.3,
              effectiveSystemPrompt
            );
            console.error(
              "[generate-palette] Retry output (first 4000 chars):",
              retryResult.text.substring(0, 4000)
            );
            try {
              parsed = JSON.parse(retryResult.text.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
            } catch (retryErr) {
              console.error(
                "[generate-palette] Retry JSON.parse threw:",
                retryErr instanceof Error ? retryErr.message : String(retryErr)
              );
              send({ type: "error", message: "AI response could not be parsed after retry" });
              controller.close();
              return;
            }
          }
        }

        // Conversational mode — model chose to respond without a palette
        if (parsed.mode === "conversational" && typeof parsed.message === "string") {
          send({ type: "conversational", message: parsed.message });
          controller.close();
          return;
        }

        if (!parsed.palette || typeof parsed.palette !== "object") {
          send({ type: "error", message: "AI response missing palette object" });
          controller.close();
          return;
        }

        const warnings: string[] = [];
        const palette = validateAndEnforce(parsed.palette, body, warnings);

        const finalReasoning =
          preJsonReasoning ||
          (typeof parsed.reasoning === "string" ? parsed.reasoning : "") ||
          "Palette applied - check the preview on the right.";

        const keyColorsSummary =
          typeof parsed.keyColorsSummary === "string" && parsed.keyColorsSummary.trim()
            ? parsed.keyColorsSummary
            : "Palette applied - check the preview on the right.";

        console.log(
          `[generate-palette] Complete: model=${model}, isRefine=${isRefine}, duration=${Date.now() - startMs}ms, warnings=${warnings.length}`
        );

        const requestDurationMs = Date.now() - requestStartTime;
        console.log(`[generate-palette] REQUEST_DURATION: ${requestDurationMs}ms`);

        send({
          type: "complete",
          palette,
          reasoning: finalReasoning,
          keyColorsSummary,
          model,
          ...(warnings.length > 0 && { warnings }),
        });

        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[generate-palette] Stream error:", msg);
        send({ type: "error", message: msg });
        controller.close();
      }
    },
  });

  return new Response(sseStream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

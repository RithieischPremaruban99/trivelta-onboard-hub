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
  "/primaryBg",
  "/primary",
  "/secondary",
  "/primaryButton",
  "/primaryButtonGradient",
  // BOX GRADIENT
  "/boxGradient1",
  "/boxGradient2",
  // TEXT
  "/lightText",
  "/placeholderText",
  "/navbarLabel",
  "/textSecondary",
  "/darkTextColor",
  // HEADER
  "/headerGradient1",
  "/headerGradient2",
  // WIN / LOSS
  "/wonGradient1",
  "/wonGradient2",
  "/wonColor",
  "/lostColor",
  "/payoutWonColor",
  "/lossAmountText",
  "/winStatusGradient1",
  "/winStatusGradient2",
  "/loseStatusGradient1",
  "/loseStatusGradient2",
  // BUTTONS & INACTIVE
  "/inactiveButtonBg",
  "/inactiveButtonText",
  "/inactiveButtonTextSecondary",
  "/inactiveTabUnderline",
  // BACKGROUNDS
  "/dark",
  "/darkContainer",
  "/betcardHeaderBg",
  "/modalBackground",
  "/notificationBg",
  "/freeBetBackground",
  "/bgColor",
  "/flexBetHeaderBg",
  "/flexBetFooterBg",
  // MISC
  "/vsColor",
  "/borderAndGradientBg",
  "/activeSecondaryGradient",
  // LANGUAGE
  "/language",
  // APP IDENTITY
  "/appName",
]);

const RGBA_RE = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;
const VALID_LANGUAGES = new Set(["en", "fr", "pt", "sw", "yo", "ha", "ar"]);

/* ── Static system prompt ─────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are Marcus, Trivelta's senior iGaming platform design consultant. You have 10 years designing sports betting platforms across Nigeria, Ghana, Kenya, Ivory Coast, South Africa, and Europe. You know what converts, what builds trust, and what dominates each market.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY & COMMUNICATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Confident and direct. You make recommendations, not suggestions.
- Maximum 2 sentences per response. No exceptions.
- Plain text only. No emojis. No em dashes. No asterisks. No bullet points.
- Never say "Great choice!", "Absolutely!", "Of course!", "Certainly!", "Sure!" or any filler affirmation.
- Never repeat what the user just said back to them.
- Never explain what you're about to do -- just do it.
- You reference real platforms naturally: Bet9ja, SportyBet, BetKing, 1xBet, Betway, Parimatch, Betika, Sportybet.
- You explain WHY a design choice works commercially in one sentence max.
- You remember everything said earlier in the conversation and build on it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every single response must use this exact format:

<chat>
[1-2 sentences max. Direct. No filler. No repetition.]
</chat>
<patch>
[RFC 6902 JSON Patch array. ONLY include if something is changing. Omit the entire <patch> block if nothing changes.]
</patch>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT MARCUS CAN CHANGE (ALLOWED PATCH PATHS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Colors (rgba format, integers 0-255 only):
/primaryBg /primary /secondary
/primaryButton /primaryButtonGradient
/boxGradient1 /boxGradient2
/lightText /placeholderText /navbarLabel /textSecondary /darkTextColor
/headerGradient1 /headerGradient2
/wonGradient1 /wonGradient2
/wonColor /lostColor /payoutWonColor /lossAmountText
/winStatusGradient1 /winStatusGradient2
/loseStatusGradient1 /loseStatusGradient2
/inactiveButtonBg /inactiveButtonText /inactiveButtonTextSecondary
/inactiveTabUnderline
/dark /darkContainer /betcardHeaderBg /modalBackground /notificationBg /freeBetBackground
/flexBetHeaderBg /flexBetFooterBg
/vsColor /borderAndGradientBg /activeSecondaryGradient

Language:
/language -- values: "en" "fr" "pt" "sw" "yo" "ha" "ar"

App name:
/appName -- value: any string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT MARCUS CANNOT CHANGE (DEFLECT THESE ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Animations -> "Animations are built by your Trivelta team from your brand assets."
- Layout / screens / features -> "Layout is optimized by your Trivelta team for conversion."
- Payment methods / odds / data feeds -> "Those are configured by your Trivelta tech team."

Language changes, color changes, app name changes -> ALWAYS handle. NEVER deflect. NEVER say "handled by dev team."

Marcus must NEVER state a specific operator brand has colors unless that brand is in the BRAND FACTS list above. When in doubt, ask for a logo instead of guessing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLARIFYING QUESTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ask exactly ONE question when the request is vague. Never two questions at once.
Map the answer directly to specific color values.

VAGUE -> QUESTION -> THEN APPLY:

"premium" ->
"What market are you targeting -- Nigeria, Ghana, Kenya, or Europe? Premium looks different in each."
  Nigeria -> dark navy rgba(10,13,20,1) + gold rgba(212,175,55,1)
  Ghana -> dark green rgba(8,12,8,1) + gold rgba(212,175,55,1)
  Kenya -> dark rgba(8,10,8,1) + green rgba(0,140,90,1)
  Europe -> near-black rgba(8,8,15,1) + silver rgba(192,192,192,1)

"modern" ->
"Clean and minimal like Betway, or bold and high-energy like Bet9ja?"
  Betway -> rgba(10,10,18,1) bg + rgba(0,134,195,1) primary
  Bet9ja -> rgba(10,13,20,1) bg + rgba(255,107,0,1) primary

"trust" ->
"Are you targeting first-time bettors or experienced players?"
  First-time -> lighter bg rgba(12,12,20,1) + blue rgba(0,94,172,1)
  Experienced -> dark rgba(10,13,20,1) + orange rgba(255,107,0,1)

"green" ->
"Betway-style trust green (dominant in Ghana, used by Odibets in Kenya), or a brighter lime energy green?"
  Betway -> rgba(0,163,108,1)
  Lime -> rgba(0,200,80,1)

"professional" ->
"More like Betway's cool blue, or Parimatch's aggressive yellow-black?"
  Betway -> rgba(0,134,195,1)
  Parimatch -> rgba(255,220,0,1) on rgba(12,12,12,1)

"luxury" / "VIP" / "exclusive" -> Apply immediately. No question.
"dark" / "darker" / "dark theme" -> Apply immediately. No question.
"Nigeria" / "Nigerian market" -> Apply immediately. No question.
"Ghana" / "Ghanaian market" -> Apply immediately. No question.
"Kenya" / "Kenyan market" -> Apply immediately. No question.
"Europe" / "European market" -> Apply immediately. No question.
"aggressive" / "energy" / "bold" -> Apply immediately. No question.
"clean" / "minimal" -> Apply immediately. No question.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MARKET COLOR INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NIGERIA (Bet9ja Orange -- highest-converting primary):
  bg: rgba(10,13,20,1)
  primary: rgba(255,107,0,1)
  button: rgba(255,107,0,1) -> rgba(200,80,0,1)
  Response: "Applying Bet9ja orange -- the highest-converting primary in the Nigerian market."

NIGERIA ALT (SportyBet Red):
  bg: rgba(8,8,11,1)
  primary: rgba(220,38,38,1)
  button: rgba(220,38,38,1) -> rgba(170,20,20,1)
  Response: "Applying SportyBet red -- a strong trust signal in the Nigerian market."

GHANA (Betway Green -- dominant):
  bg: rgba(8,12,8,1)
  primary: rgba(0,163,108,1)
  button: rgba(0,163,108,1) -> rgba(0,120,80,1)
  Response: "Applying Betway green -- dominant in Ghana and a strong trust signal."

KENYA / EAST AFRICA (SportyBet Red -- dominant market leader):
  bg: rgba(8,8,11,1)
  primary: rgba(220,38,38,1)
  button: rgba(220,38,38,1) -> rgba(170,20,20,1)
  Response: "Applying SportyBet red -- the dominant brand palette in the Kenyan market."

KENYA ALT (Betway / Odibets Green):
  bg: rgba(8,10,8,1)
  primary: rgba(0,140,90,1)
  button: rgba(0,140,90,1) -> rgba(0,100,65,1)
  Response: "Applying a high-performance green palette -- strong with Betway and Odibets in East Africa."

IVORY COAST / FRANCOPHONE WEST AFRICA (1xBet / Premier Bet):
  language: "fr"
  bg: rgba(8,10,14,1)
  primary: rgba(0,163,108,1)
  Response: "Switching to French with a green palette -- standard for Francophone West Africa."

EUROPE (Silver Premium):
  bg: rgba(8,8,15,1)
  primary: rgba(192,192,192,1)
  button: rgba(150,150,165,1) -> rgba(100,100,120,1)
  Response: "Applying near-black with silver accents -- standard for European premium platforms."

VIP / LUXURY / GOLD:
  bg: rgba(8,8,15,1)
  primary: rgba(212,175,55,1)
  button: rgba(212,175,55,1) -> rgba(160,120,30,1)
  Response: "Applying deep navy with gold -- the premium signal across all iGaming markets."

AGGRESSIVE / HIGH ENERGY:
  bg: rgba(10,5,5,1)
  primary: rgba(220,38,38,1)
  button: rgba(220,38,38,1) -> rgba(170,20,20,1)
  Response: "Going with deep red -- signals high stakes and urgency."

CLEAN / MINIMAL:
  bg: rgba(8,8,15,1)
  primary: rgba(255,255,255,1)
  button: rgba(255,255,255,1) -> rgba(200,200,200,1)
  Response: "Applying a clean minimal palette -- light accents on deep background."

DARK THEME:
  bg: rgba(6,6,10,1)
  dark: rgba(8,8,12,1)
  darkContainer: rgba(12,12,18,1)
  Response: "Darkening the background."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND FACTS -- NEVER INVENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verified operator brand colors. Never deviate from these. Never guess for brands not listed.

SportyBet = RED + white (NOT green -- common AI mistake; always red across all African markets: Kenya, Nigeria, Ghana, Tanzania, Uganda, Zambia)
Bet9ja = Orange + dark navy
Betway = Green + black
1xBet = Blue + white
BetKing = Blue + yellow
BetLion = Green + white
Odibets = Green + white
Premier Bet = Green + yellow

RULE: If a user mentions an operator brand you do NOT have verified data for:
- DO NOT invent or assume colors
- DO NOT extrapolate from region ("African brands are usually green")
- DO ask: "I don't have verified brand data for [brand name]. Share their logo or website and I'll extract the exact palette."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIFIC PLATFORM REFERENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Bet9ja" -> rgba(255,107,0,1) primary, rgba(10,13,20,1) bg
"SportyBet" -> rgba(220,38,38,1) primary, rgba(8,8,11,1) bg
"BetKing" -> rgba(253,111,39,1) primary, rgba(10,13,20,1) bg
"1xBet" -> rgba(0,94,172,1) primary, rgba(8,8,15,1) bg
"Betway" -> rgba(0,134,195,1) primary, rgba(8,8,15,1) bg
"Parimatch" -> rgba(255,220,0,1) primary, rgba(10,10,10,1) bg
"Betika" -> rgba(0,150,90,1) primary, rgba(8,10,8,1) bg
"22Bet" -> rgba(0,94,172,1) primary, rgba(8,8,15,1) bg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply immediately. Never deflect. Never say "handled by dev team."

French / francais / France / Ivory Coast / Senegal / Cameroon / Benin ->
<patch>[{"op":"replace","path":"/language","value":"fr"}]</patch>
Response: "Platform switched to French."

Portuguese / portugues / Brazil / Mozambique / Angola ->
<patch>[{"op":"replace","path":"/language","value":"pt"}]</patch>
Response: "Platform switched to Portuguese."

Swahili / kiswahili / Kenya / Tanzania / Uganda / East Africa ->
<patch>[{"op":"replace","path":"/language","value":"sw"}]</patch>
Response: "Platform switched to Swahili."

Yoruba / yoruba / Southwest Nigeria ->
<patch>[{"op":"replace","path":"/language","value":"yo"}]</patch>
Response: "Platform switched to Yoruba."

Hausa / Northern Nigeria / Niger ->
<patch>[{"op":"replace","path":"/language","value":"ha"}]</patch>
Response: "Platform switched to Hausa."

Arabic / MENA / Middle East ->
<patch>[{"op":"replace","path":"/language","value":"ar"}]</patch>
Response: "Platform switched to Arabic."

English / back to English / reset language ->
<patch>[{"op":"replace","path":"/language","value":"en"}]</patch>
Response: "Platform switched back to English."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APP NAME COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"change app name to X" / "rename to X" / "call it X" / "name is X" ->
Extract the brand name verbatim from the message.
<patch>[{"op":"replace","path":"/appName","value":"[ExactName]"}]</patch>
Response: "App name updated to [ExactName]."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMBINED MARKET COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply all changes in a single patch. Explain in one sentence.

"French for Ivory Coast" / "Ivory Coast market" ->
  language fr + green palette rgba(0,163,108,1) + rgba(8,10,14,1) bg
  Response: "French language with a West African green palette -- standard for Ivory Coast."

"Nigerian market setup" ->
  language en + orange rgba(255,107,0,1) + rgba(10,13,20,1) bg
  Response: "Nigerian market setup applied -- Bet9ja orange with English interface."

"Ghanaian market" ->
  language en + green rgba(0,163,108,1) + rgba(8,12,8,1) bg
  Response: "Ghanaian market setup applied -- Betway green is the dominant palette in Ghana."

"East Africa" / "Kenya setup" ->
  language sw + rgba(0,140,90,1) + rgba(8,10,8,1) bg
  Response: "East African setup applied with Swahili and a high-performance green."

"South Africa" ->
  language en + rgba(0,94,172,1) + rgba(8,8,15,1) bg
  Response: "South African market setup -- professional blue palette, familiar to local bettors."

"premium Nigerian" ->
  language en + gold rgba(212,175,55,1) + rgba(10,13,20,1) bg
  Response: "Premium Nigerian setup -- deep navy with gold, high-end positioning."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROACTIVE FOLLOW-UP (ALWAYS after a change)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After applying orange: suggest updating button gradient for cohesion.
After applying dark bg: suggest gold or orange primary to complement.
After applying green: suggest updating won-bet gradient to match.
After applying gold: suggest darkening the background for contrast.
After language change: suggest a matching market color palette.
After app name change: offer to generate a logo.

Only suggest one thing. Keep it in the same 2-sentence response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGO GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"generate logo for X" / "create logo" / "make me a logo" ->
Extract brand name verbatim from message.
<chat>Generating your [ExactBrandName] logo now.</chat>
No patch. No extra sentences. Never add commentary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGO ANALYSIS (when image is provided)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyze the dominant colors in the logo image.
Extract: primary brand color, background tone, accent color.
Map to rgba values and apply to platform colors.
<chat>Matching platform colors to your logo.</chat>
<patch>[extracted colors applied]</patch>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCKED DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If context.isLocked = true:
<chat>Your design is locked. Contact your Account Manager to make further changes.</chat>
No patch. No further action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT AWARENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Marcus always uses the injected context:
- clientName: address the client by name on first message only
- currentColors: know what colors are already set before suggesting
- language: know current language before suggesting language changes
- appName: know current app name
- hasLogo: if true, can reference it in suggestions
- isLocked: if true, deflect all changes

On first message in a conversation, greet with:
"Welcome [clientName], I'm Marcus -- let's build your platform identity."
Then immediately ask the most useful first question based on context.

If hasLogo = true but no color change has been made yet, proactively suggest:
"Want me to extract your brand colors from your logo and apply them to the platform?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEW-SHOT EXAMPLES -- follow these exactly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: "I want a premium design"
<chat>What market are you targeting -- Nigeria, Ghana, Kenya, or Europe? Premium looks different in each.</chat>

User: "Nigeria" (after premium question)
<chat>Nigerian premium platforms use deep navy with gold -- applying that now.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(10,13,20,1)"},{"op":"replace","path":"/primary","value":"rgba(212,175,55,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(212,175,55,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(160,120,30,1)"}]</patch>

User: "make it look like Bet9ja"
<chat>Applying Bet9ja orange -- the highest-converting primary in the Nigerian market.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(10,13,20,1)"},{"op":"replace","path":"/primary","value":"rgba(255,107,0,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(255,107,0,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(200,80,0,1)"}]</patch>

User: "change to French"
<chat>Platform switched to French.</chat>
<patch>[{"op":"replace","path":"/language","value":"fr"}]</patch>

User: "Ivory Coast market"
<chat>French language with a West African green palette -- standard for Ivory Coast.</chat>
<patch>[{"op":"replace","path":"/language","value":"fr"},{"op":"replace","path":"/primaryBg","value":"rgba(8,10,14,1)"},{"op":"replace","path":"/primary","value":"rgba(0,163,108,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(0,163,108,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(0,120,80,1)"}]</patch>

User: "too bright"
<chat>Darkening the background.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(8,8,15,1)"}]</patch>

User: "change app name to BetKing"
<chat>App name updated to BetKing.</chat>
<patch>[{"op":"replace","path":"/appName","value":"BetKing"}]</patch>

User: "generate logo for ArthurBet"
<chat>Generating your ArthurBet logo now.</chat>

User: "I want animations"
<chat>Animations are built by your Trivelta team from your brand assets.</chat>

User: "can you change the layout?"
<chat>Layout is optimized by your Trivelta team for conversion.</chat>

User: "make the won color brighter"
<chat>Brightening the win color.</chat>
<patch>[{"op":"replace","path":"/wonColor","value":"rgba(80,230,120,1)"},{"op":"replace","path":"/payoutWonColor","value":"rgba(70,210,140,1)"}]</patch>

User: "the placeholder text is too dark"
<chat>Lightening the placeholder text.</chat>
<patch>[{"op":"replace","path":"/placeholderText","value":"rgba(180,180,195,1)"}]</patch>

User: "match the inactive buttons to the background"
<chat>Adjusting inactive button background to blend with the current base.</chat>
<patch>[{"op":"replace","path":"/inactiveButtonBg","value":"rgba(15,15,22,1)"}]</patch>

User: "I want something for a VIP platform"
<chat>Applying deep navy with gold -- the premium signal across all iGaming markets.</chat>
<patch>[{"op":"replace","path":"/primaryBg","value":"rgba(8,8,15,1)"},{"op":"replace","path":"/primary","value":"rgba(212,175,55,1)"},{"op":"replace","path":"/primaryButton","value":"rgba(212,175,55,1)"},{"op":"replace","path":"/primaryButtonGradient","value":"rgba(160,120,30,1)"},{"op":"replace","path":"/wonColor","value":"rgba(212,175,55,1)"}]</patch>

User: "navbar text is hard to read"
<chat>Increasing navbar label contrast.</chat>
<patch>[{"op":"replace","path":"/navbarLabel","value":"rgba(240,240,250,1)"}]</patch>

User: "make the betcard header darker"
<chat>Darkening the bet card header.</chat>
<patch>[{"op":"replace","path":"/betcardHeaderBg","value":"rgba(18,18,26,1)"}]</patch>

User: "the lost color looks too pink"
<chat>Shifting the lost color to a deeper red.</chat>
<patch>[{"op":"replace","path":"/lostColor","value":"rgba(180,40,60,1)"},{"op":"replace","path":"/lossAmountText","value":"rgba(220,60,60,1)"}]</patch>`;

/* ── Context interface ────────────────────────────────────────────────────── */

interface RequestContext {
  clientName?: string;
  appName?: string;
  language?: string;
  currentColors?: Record<string, string>;
  hasLogo?: boolean;
  hasIcon?: boolean;
  isLocked?: boolean;
  platform?: string;
  recentChange?: string | null;
  clientId?: string;
}

function buildContextBlock(ctx: RequestContext): string {
  return `CLIENT CONTEXT:
- Client name: ${ctx.clientName ?? "Client"}
- App name: ${ctx.appName || "not set"}
- Language: ${ctx.language || "en"}
- Has logo: ${ctx.hasLogo ? "yes" : "no"}
- Has icon: ${ctx.hasIcon ? "yes" : "no"}
- Design locked: ${ctx.isLocked ? "YES -- deflect all changes" : "no"}
- Current primary color: ${ctx.currentColors?.primary || "not set"}
- Current background: ${ctx.currentColors?.primaryBg || "not set"}

Use this context to give relevant, personalized advice.
If isLocked is true, deflect ALL change requests.

`;
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
    "Create",
    "Generate",
    "Design",
    "Make",
    "Draw",
    "Build",
    "Give",
    "Need",
    "Want",
    "Logo",
    "Icon",
    "App",
    "Brand",
    "Mark",
    "Show",
    "My",
    "The",
    "Your",
    "Our",
  ]);
  for (const word of text.split(/\s+/)) {
    const clean = word.replace(/[^A-Za-z0-9]/g, "");
    if (clean.length >= 3 && /^[A-Z]/.test(clean) && !SKIP.has(clean)) return clean;
  }
  return null;
}

function detectImageRequest(
  text: string,
): { kind: "logo" | "icon"; brandName: string | null } | null {
  const lower = text.toLowerCase();
  const wantsCreate = /\b(create|generate|design|make|draw|build|give me|need|want|show me)\b/.test(
    lower,
  );
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
  const prompt =
    kind === "icon"
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
  const prompt =
    kind === "icon"
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

    const uploadResp = await fetch(`${supabaseUrl}/storage/v1/object/studio-assets/${fileName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: imageBuffer,
    });

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

/* ── Generate logo: Ideogram -> DALL-E fallback ─────────────────────────── */

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
    console.warn("[studio-chat] Ideogram failed -- falling back to DALL-E");
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
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const IDEOGRAM_API_KEY = Deno.env.get("IDEOGRAM_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    console.error(
      "[studio-chat] ANTHROPIC_API_KEY missing -- add it in Supabase Edge Function secrets",
    );
    return new Response(
      JSON.stringify({ error: "AI service not configured. Contact your administrator." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const body: RequestBody = await req.json();

  // Support both new format { message, history } and legacy { messages }
  const userMessage: string = body.message ?? body.messages?.slice(-1)[0]?.content ?? "";
  const history: Message[] = body.history ?? body.messages?.slice(0, -1) ?? [];
  const logoUrl: string | null = body.logoUrl ?? null;

  // Merge context -- prefer explicit context object, fall back to top-level legacy fields
  const ctx: RequestContext = {
    ...body.context,
    currentColors: body.context?.currentColors ?? body.currentColors,
    clientId: body.context?.clientId ?? body.clientId ?? "unknown",
  };
  const clientId: string = ctx.clientId ?? "unknown";

  const contextBlock = buildContextBlock(ctx);

  const imageReq = detectImageRequest(userMessage);

  // Detect style hint for Ideogram
  const msgLower = userMessage.toLowerCase();
  const logoStyle = msgLower.includes("green")
    ? "green and gold"
    : msgLower.includes("blue")
      ? "blue and silver"
      : msgLower.includes("red")
        ? "red and white"
        : msgLower.includes("purple")
          ? "purple and gold"
          : "orange and gold";

  // Start logo generation immediately in parallel with Claude
  const imagePromise: Promise<{ url: string | null; error: string | null }> = imageReq
    ? generateLogo(imageReq.brandName, imageReq.kind, logoStyle, IDEOGRAM_API_KEY, OPENAI_API_KEY)
    : Promise.resolve({ url: null, error: null });

  // Build Claude message content -- attach logo image when available and relevant.
  // Only use stable Supabase Storage URLs (ephemeral CDN URLs expire and break Vision).
  const isStableLogoUrl = !!logoUrl && logoUrl.includes("/storage/v1/object/public/");
  const shouldPassImage = isStableLogoUrl && isLogoContext(userMessage) && !imageReq;

  // Inject context block at the start of the user's message turn
  const userMessageWithContext = contextBlock + "User: " + userMessage;

  const userContent: Array<Record<string, unknown>> = [];
  if (shouldPassImage) {
    userContent.push({ type: "image", source: { type: "url", url: logoUrl } });
  }
  userContent.push({ type: "text", text: userMessageWithContext });

  const claudeMessages: Array<{ role: string; content: unknown }> = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: shouldPassImage ? userContent : userMessageWithContext },
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
            system: SYSTEM_PROMPT,
            messages: claudeMessages,
          }),
        });

        if (!claudeResp.ok) {
          send({ type: "error", message: await claudeResp.text() });
          controller.close();
          return;
        }

        // -- XML stream-parsing state machine --
        // States: before_chat -> in_chat -> after_chat -> in_patch
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
              if (idx !== -1) {
                pending = pending.slice(idx + 6);
                state = "in_chat";
                looped = true;
              } else if (final) pending = "";
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
              if (idx !== -1) {
                pending = pending.slice(idx + 7);
                state = "in_patch";
                looped = true;
              } else if (final) pending = "";
              else if (pending.length > 7) pending = pending.slice(pending.length - 7);
            } else if (state === "in_patch") {
              const idx = pending.indexOf("</patch>");
              if (idx !== -1) {
                patchContent = pending.slice(0, idx).trim();
                pending = "";
                // Don't change state -- we're done
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
            } catch {
              /* skip malformed SSE lines */
            }
          }
        }
        processText("", true); // flush

        // Send validated patch if Claude produced one
        if (patchContent) {
          try {
            const ops = JSON.parse(patchContent);
            if (Array.isArray(ops) && ops.length > 0) {
              const validOps = ops.filter((op: Record<string, unknown>) => {
                if (op.op !== "replace") return false;
                if (typeof op.path !== "string" || !ALLOWED_PATCH_PATHS.has(op.path)) return false;
                if (typeof op.value !== "string") return false;
                if (op.path === "/language")
                  return VALID_LANGUAGES.has((op.value as string).trim());
                if (op.path === "/appName") {
                  const v = (op.value as string).trim();
                  return v.length > 0 && v.length <= 50;
                }
                return RGBA_RE.test((op.value as string).trim());
              });
              if (validOps.length > 0) send({ type: "patch", ops: validOps });
            }
          } catch (e) {
            console.error("[studio-chat] Patch parse error:", e, patchContent.slice(0, 200));
          }
        }

        // Image generation -- persist to stable Supabase Storage URL before sending
        if (imageReq) {
          send({
            type: "generating",
            message: `Generating ${imageReq.kind}...`,
            estimated_seconds: 15,
          });
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
      Connection: "keep-alive",
    },
  });
});

/**
 * Edge Function: generate-landing-pages
 *
 * Asks Claude (Haiku) for brand-specific JSON content only, then substitutes
 * the JSON values into the Scorama-derived HTML templates. This is ~70% faster
 * than asking Claude to generate full HTML (target: 15–25 s instead of 60–90 s).
 *
 * POST /functions/v1/generate-landing-pages
 * Auth: verify_jwt=false + internal callerClient.auth.getUser() check
 */

import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";
import {
  INDEX_TEMPLATE,
  TERMS_TEMPLATE,
  PRIVACY_TEMPLATE,
  RG_TEMPLATE,
} from "./templates.ts";

// ── Types ──────────────────────────────────────────────────────────────────

interface GenerationRequest {
  legalCompanyName: string;
  brandName: string;
  primaryDomain: string;
  platformSubdomain?: string;
  supportEmail: string;
  supportHelpline?: string;
  licenseJurisdiction: string;
  licenseNumber?: string;
  rgHelplines?: string;
  brandPrimaryColor: string;
  brandAccentColor?: string;
  brandLogoUrl: string;
}

interface AiJson {
  tagline: string;
  description: string;
  country_short: string;
  terms_content: string;
  privacy_content: string;
  rg_content: string;
  rg_helplines_html: string;
}

// ── Color helpers ──────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  const r = Math.min(255, (n >> 16) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return (
    "#" +
    ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
  );
}

// ── Template engine ────────────────────────────────────────────────────────

function render(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

// ── AI prompt ─────────────────────────────────────────────────────────────

function buildUserPrompt(input: GenerationRequest): string {
  return `Generate brand-specific content for this iGaming operator:

Brand: ${input.brandName}
Legal entity: ${input.legalCompanyName}
Jurisdiction: ${input.licenseJurisdiction}
License number: ${input.licenseNumber ?? "not yet assigned"}
Primary color: ${input.brandPrimaryColor}
Domain: ${input.primaryDomain}
Support email: ${input.supportEmail}
RG helplines override: ${input.rgHelplines ?? "(use jurisdiction defaults)"}

Return ONLY this JSON (no markdown fences, no commentary):

{
  "tagline": "5-8 word punchy hero tagline. Pattern examples: 'Bet Smart. Win Big.' / 'Your Game. Your Rules.' / 'Big Odds. Bigger Wins.'",
  "description": "2-sentence hero description mentioning the country and product (sportsbook + casino). Under 25 words total.",
  "country_short": "Short uppercase country label for the NOW LIVE badge. Examples: NIGERIA, SOUTH AFRICA, KENYA, GHANA, MALTA",
  "terms_content": "<h2>1. Introduction</h2><p>...</p> Full jurisdiction-appropriate Terms & Conditions HTML body. ~1200 words. Sections: Introduction (mention ${input.legalCompanyName} and ${input.licenseJurisdiction}), Amending Terms, Account Eligibility (18+), Verification, Duplicate Accounts, Account Security, Bet Confirmation, Bonuses, Payouts, Deposits, Exceptional Occurrence, Intellectual Property, Liability, Governing Law (${input.licenseJurisdiction}), Entire Agreement. Use <h2>, <p>, <ul>, <li> tags only.",
  "privacy_content": "<p>We are committed to protecting your privacy...</p><h2>1. What information we collect</h2><p>...</p> Full Privacy Policy HTML. ~700 words. Sections: intro, What we collect, How we use, Disclosure, Security, Retention, Your rights, Changes, Contact (${input.supportEmail}). Use <h2>, <p>, <ul>, <li> tags only.",
  "rg_content": "<h2>Our Commitment</h2><p>...</p> Responsible Gambling body HTML (do NOT include helplines here — those go in rg_helplines_html). ~400 words. Sections: Our Commitment, Staying in Control (bullet list), Responsible Gambling Tools (Deposit Limits, Time-Outs & Self-Exclusion), Signs of Problem Gambling (bullet list), Underage Gambling Prohibited. Use <h2>, <p>, <ul>, <li>, <strong> tags only.",
  "rg_helplines_html": "<div class='support-card'><strong>Organization Name</strong><p>Website: <a href='https://...' target='_blank'>url</a><br>Helpline: number</p></div> Minimum 2 jurisdiction-specific gambling help resources for ${input.licenseJurisdiction} formatted as support-card divs."
}`;
}

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Internal auth check ──────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) {
    console.warn("[generate-landing-pages] Auth failed:", authError?.message ?? "no user");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const input: GenerationRequest = await req.json();

    // ── Call Claude Haiku with 45 s abort ──────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    let rawText: string;
    try {
      const client = new Anthropic({
        apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
      });

      const message = await client.messages.create(
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          system:
            "You generate brand-specific content for iGaming operator websites. Output valid JSON only. No markdown fences. No commentary.",
          messages: [{ role: "user", content: buildUserPrompt(input) }],
        },
        { signal: controller.signal },
      );

      rawText =
        message.content[0]?.type === "text" ? message.content[0].text : "";
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "AI generation timed out. Please try again." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    // ── Parse JSON ─────────────────────────────────────────────────────────
    let aiJson: AiJson;
    try {
      // Strip accidental markdown fences if Claude adds them despite instructions
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      aiJson = JSON.parse(cleaned);
    } catch {
      console.error("[generate-landing-pages] JSON parse failed. Raw:", rawText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "AI returned malformed JSON. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Build substitution vars ────────────────────────────────────────────
    const primaryColor = input.brandPrimaryColor.startsWith("#")
      ? input.brandPrimaryColor
      : `#${input.brandPrimaryColor}`;

    const lightColor = input.brandAccentColor
      ? (input.brandAccentColor.startsWith("#") ? input.brandAccentColor : `#${input.brandAccentColor}`)
      : lighten(primaryColor, 0.22);

    const platformUrl = input.platformSubdomain
      ? (input.platformSubdomain.startsWith("http") ? input.platformSubdomain : `https://${input.platformSubdomain}`)
      : `https://${input.primaryDomain}`;

    const vars: Record<string, string> = {
      BRAND_NAME: input.brandName,
      LEGAL_COMPANY: input.legalCompanyName,
      LOGO_URL: input.brandLogoUrl,
      PRIMARY_COLOR: primaryColor,
      PRIMARY_LIGHT: lightColor,
      PRIMARY_BG_TINT: hexToRgba(primaryColor, 0.07),
      PRIMARY_BORDER_TINT: hexToRgba(primaryColor, 0.15),
      PRIMARY_BORDER_STRONG: hexToRgba(primaryColor, 0.25),
      DOMAIN: input.primaryDomain,
      PLATFORM_URL: platformUrl,
      SUPPORT_EMAIL: input.supportEmail,
      COUNTRY: aiJson.country_short,
      JURISDICTION_FULL: input.licenseJurisdiction,
      TAGLINE: aiJson.tagline,
      DESCRIPTION: aiJson.description,
      TERMS_CONTENT: aiJson.terms_content,
      PRIVACY_CONTENT: aiJson.privacy_content,
      RG_CONTENT: aiJson.rg_content,
      RG_HELPLINES_HTML: aiJson.rg_helplines_html,
    };

    const pages = {
      index: render(INDEX_TEMPLATE, vars),
      terms: render(TERMS_TEMPLATE, vars),
      privacy: render(PRIVACY_TEMPLATE, vars),
      rg: render(RG_TEMPLATE, vars),
    };

    return new Response(JSON.stringify({ pages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-landing-pages] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

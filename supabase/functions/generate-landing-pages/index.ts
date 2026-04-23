/**
 * Edge Function: generate-landing-pages
 *
 * Generates 4 production-quality HTML pages for an iGaming operator:
 * landing page, terms & conditions, privacy policy, responsible gambling.
 *
 * POST /functions/v1/generate-landing-pages
 * Body: GenerationRequest (see interface below)
 * Auth: JWT required
 */

import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";
import { makeCorsHeaders } from "../_shared/cors.ts";

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
}

function buildSystemPrompt(input: GenerationRequest): string {
  return `You are an expert iGaming legal and marketing content generator. You produce production-quality HTML pages for licensed sportsbook and casino operators.

Generate FOUR separate, complete, standalone HTML files:
1. index.html — Landing page (marketing homepage)
2. terms.html — Terms and Conditions
3. privacy.html — Privacy Policy
4. responsible-gambling.html — Responsible Gambling page

Requirements:
- Each file must be complete, valid HTML5 with <!DOCTYPE html>, <html>, <head>, <body>
- Inline CSS in <style> tags (no external stylesheets)
- Use DM Sans (body) + Syne (headings) from Google Fonts CDN
- Dark theme background (#0A0A0F) with the provided brand color as accent
- Responsive, professional design
- All 4 files link to each other via a consistent footer (terms.html, privacy.html, responsible-gambling.html)
- Include jurisdiction-specific legal content based on the operator's license location
- Include jurisdiction-specific responsible gambling resources

Jurisdiction content requirements:
- Nigeria: Reference Federal Republic of Nigeria laws, NLRC, 18+ age requirement, GambleAlert Nigeria support
- South Africa: Reference National Gambling Act, provincial gambling boards, 18+, Responsible Gambling Foundation
- Kenya: Reference Betting Control Act, BCLB, 18+, local support
- Ghana: Reference Gaming Commission of Ghana, 18+
- Tanzania: Reference Gaming Board of Tanzania, 18+
- Uganda: Reference National Lotteries & Gaming Regulatory Board, 25+ (Uganda minimum)
- Mexico: Reference SEGOB/DGJS, 18+
- Curaçao: Reference CGCB, 18+
- Malta: Reference MGA, 18+, EU GDPR compliance
- Other: generic international iGaming language, 18+

Design requirements for the landing page (index.html):
- Hero section with brand name wordmark + tagline
- 3-4 feature cards highlighting sportsbook, live betting, fast payouts, mobile experience
- CTA button linking to platform subdomain (if provided) or primary domain
- Footer with links to Terms, Privacy, Responsible Gambling + support email + 18+ icon + license jurisdiction note

Output format:
You MUST output exactly this structure with no additional commentary:

===INDEX===
[complete index.html content]
===TERMS===
[complete terms.html content]
===PRIVACY===
[complete privacy.html content]
===RG===
[complete responsible-gambling.html content]
===END===

No text before ===INDEX=== or after ===END===. No markdown code fences.`;
}

function buildUserPrompt(input: GenerationRequest): string {
  return `Generate the 4 HTML files for this operator:

Brand: ${input.brandName}
Legal entity: ${input.legalCompanyName}
Primary domain: ${input.primaryDomain}
Platform subdomain: ${input.platformSubdomain ?? "(same as primary)"}
Support email: ${input.supportEmail}
Support helpline: ${input.supportHelpline ?? "(not provided)"}
License jurisdiction: ${input.licenseJurisdiction}
License number: ${input.licenseNumber ?? "(not yet assigned)"}
Responsible gambling helplines: ${input.rgHelplines ?? "(use jurisdiction defaults)"}
Primary brand color: ${input.brandPrimaryColor}
Accent color: ${input.brandAccentColor ?? "(derive lighter shade from primary)"}

Generate all 4 pages now.`;
}

function parseGeneratedHtml(
  raw: string,
): { index: string; terms: string; privacy: string; rg: string } {
  const extract = (start: string, end: string): string => {
    const startIdx = raw.indexOf(start);
    const endIdx = raw.indexOf(end, startIdx + start.length);
    if (startIdx === -1 || endIdx === -1) return "";
    return raw.substring(startIdx + start.length, endIdx).trim();
  };

  return {
    index: extract("===INDEX===", "===TERMS==="),
    terms: extract("===TERMS===", "===PRIVACY==="),
    privacy: extract("===PRIVACY===", "===RG==="),
    rg: extract("===RG===", "===END==="),
  };
}

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerationRequest = await req.json();

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: buildSystemPrompt(body),
      messages: [{ role: "user", content: buildUserPrompt(body) }],
    });

    const rawContent =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    const pages = parseGeneratedHtml(rawContent);

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

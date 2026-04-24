// supabase/functions/prospect-submitted-v2/index.ts
//
// Event 1: Prospect Form Submission
//
// Triggered when a new prospect completes the pre-onboarding form in
// the Trivelta Suite. Creates a fresh Notion page in the Clients DB
// with:
//   - Status = Prospect
//   - Onboarding Phase = Pre-Sale
//   - Primary AM = Aidan (always)
//   - Account Manager = routed by country (Alex for LatAm/Iberia, Davi otherwise,
//     Iberia = both)
//   - Full body = Scorama Long template (fetched from TEMPLATE_PAGE_ID, cached 1h)
//
// Idempotency: if client.notion_page_id is already set, we SKIP creation
// and just update properties (defensive against double-submit).
//
// Error handling: Notion failures are logged to notion_sync_pending but
// NEVER block the prospect submission from succeeding.

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildProspectProperties,
  createClientPage,
  findPageByTriveltaClientId,
  getTemplateBody,
  type ProspectPayload,
} from "../_shared/notion-clients.ts";
import { makeCorsHeaders } from "../_shared/cors.ts";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const {
      prospect_id,
      client_id, // Trivelta Supabase client_id (if already converted)
      client_name,
      primary_contact_name,
      primary_contact_email,
      website,
      country,
      drive_link,
    } = body;

    // We always log to DB regardless of Notion outcome
    const triveltaId = client_id ?? prospect_id;
    if (!triveltaId || !client_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: client_name, (client_id or prospect_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload: ProspectPayload = {
      triveltaClientId: triveltaId,
      clientName: client_name,
      primaryContactName: primary_contact_name,
      primaryContactEmail: primary_contact_email,
      website,
      country,
      driveLink: drive_link,
    };

    // Notion write — wrapped in try/catch (NEVER blocks submission success)
    let notionResult: { pageId: string; url: string } | null = null;
    let notionError: string | null = null;

    try {
      // Idempotency: check if page already exists
      const existingPageId = await findPageByTriveltaClientId(NOTION_TOKEN, triveltaId);

      if (existingPageId) {
        console.log(`[prospect-submitted-v2] Page exists for ${triveltaId}: ${existingPageId} — skipping create`);
        notionResult = { pageId: existingPageId, url: `https://notion.so/${existingPageId.replace(/-/g, "")}` };
      } else {
        const properties = buildProspectProperties(payload);
        const templateBlocks = await getTemplateBody(NOTION_TOKEN);
        notionResult = await createClientPage(NOTION_TOKEN, properties, templateBlocks);
        console.log(`[prospect-submitted-v2] Created Notion page ${notionResult.pageId} for ${triveltaId}`);
      }
    } catch (err) {
      console.error("[prospect-submitted-v2] Notion sync failed:", err);
      notionError = err instanceof Error ? err.message : String(err);
    }

    // Persist result to Supabase (so we have the Notion page ID for Event 2 + 3)
    if (notionResult) {
      await supabase
        .from("clients")
        .update({
          notion_page_id: notionResult.pageId,
          notion_sync_pending: false,
          notion_sync_error: null,
          notion_sync_attempted_at: new Date().toISOString(),
        })
        .eq("id", triveltaId);
    } else if (notionError) {
      await supabase
        .from("clients")
        .update({
          notion_sync_pending: true,
          notion_sync_error: notionError,
          notion_sync_attempted_at: new Date().toISOString(),
        })
        .eq("id", triveltaId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notion_synced: notionResult !== null,
        notion_page_id: notionResult?.pageId ?? null,
        notion_url: notionResult?.url ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[prospect-submitted-v2] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

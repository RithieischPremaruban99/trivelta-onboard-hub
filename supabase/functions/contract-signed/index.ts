// supabase/functions/contract-signed/index.ts
//
// Event 2: Contract Signed
//
// Triggered when the AE clicks "Mark Contract Signed" on a Prospect in
// the Trivelta Suite. Updates the existing Notion page:
//   - Status          → Onboarding
//   - Onboarding Phase → Contract
//   - Contract Start  → today
//
// Body is NOT modified. The AM retroactively checks off Phase 1
// (Pre-Sale) tasks in the Notion page themselves.
//
// Requires clients.notion_page_id to be set (from Event 1).
// If missing, falls back to findPageByTriveltaClientId.

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  findPageByTriveltaClientId,
  props,
  updatePageProperties,
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
    const { client_id, contract_start_date } = body;

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve Notion page ID — try cached value first, then lookup by property
    const { data: clientRow } = await supabase
      .from("clients")
      .select("notion_page_id")
      .eq("id", client_id)
      .maybeSingle();

    let notionPageId = clientRow?.notion_page_id;

    if (!notionPageId) {
      try {
        notionPageId = await findPageByTriveltaClientId(NOTION_TOKEN, client_id);
      } catch (err) {
        console.error("[contract-signed] Lookup failed:", err);
      }
    }

    if (!notionPageId) {
      // Log as pending sync — but don't block the contract-signed action
      await supabase
        .from("clients")
        .update({
          notion_sync_pending: true,
          notion_sync_error: "Could not locate Notion page at Contract Signed",
          notion_sync_attempted_at: new Date().toISOString(),
        })
        .eq("id", client_id);

      return new Response(
        JSON.stringify({
          success: true,
          notion_synced: false,
          warning: "Notion page not found — sync flagged for manual review",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update Notion properties
    const contractStart = contract_start_date ?? new Date().toISOString().split("T")[0];

    let notionError: string | null = null;
    try {
      await updatePageProperties(NOTION_TOKEN, notionPageId, {
        "Status": props.status("Onboarding"),
        "Onboarding Phase": props.select("Contract"),
        "Contract Start": props.date(contractStart),
      });
      console.log(`[contract-signed] Updated ${notionPageId} for client ${client_id}`);
    } catch (err) {
      console.error("[contract-signed] Update failed:", err);
      notionError = err instanceof Error ? err.message : String(err);
    }

    // Update Supabase client row
    await supabase
      .from("clients")
      .update({
        contract_signed_at: new Date().toISOString(),
        contract_start_date: contractStart,
        onboarding_phase: "Contract",
        notion_sync_pending: notionError !== null,
        notion_sync_error: notionError,
        notion_sync_attempted_at: new Date().toISOString(),
      })
      .eq("id", client_id);

    return new Response(
      JSON.stringify({
        success: true,
        notion_synced: notionError === null,
        notion_page_id: notionPageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[contract-signed] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

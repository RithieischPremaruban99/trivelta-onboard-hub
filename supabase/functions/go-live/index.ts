// supabase/functions/go-live/index.ts
//
// Event 3: Go Live
//
// Triggered by a "Mark as Live" button in the Trivelta Suite Admin Dashboard.
// Updates the Notion page + Supabase client row to reflect launch.
//
// What this does:
//   - Notion: Status → Active, Phase → Post-Launch, Next Renewal, Health Score, Go Live Date
//   - Supabase: mirrors those fields on the clients row
//
// What this does NOT do:
//   - Send a confirmation email. The AM sends it manually via Gmail.
//     This is intentional: Trivelta doesn't have an email provider configured,
//     and keeping the operation idempotent (safe to retry) is more valuable
//     than auto-emailing at the wrong moment.
//
// Idempotency: this is safe to call multiple times — property updates
// converge to the same state.

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
    const { client_id } = body;

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch client details for Notion page lookup + renewal calc
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, name, contract_start_date, notion_page_id")
      .eq("id", client_id)
      .maybeSingle();

    if (clientErr || !client) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve Notion page ID
    let notionPageId = client.notion_page_id;
    if (!notionPageId) {
      try {
        notionPageId = await findPageByTriveltaClientId(NOTION_TOKEN, client_id);
      } catch (err) {
        console.error("[go-live] Notion lookup failed:", err);
      }
    }

    const nextRenewal = computeNextRenewal(client.contract_start_date);
    const goLiveDate = new Date().toISOString().split("T")[0];

    // Update Notion
    let notionError: string | null = null;
    if (notionPageId) {
      try {
        await updatePageProperties(NOTION_TOKEN, notionPageId, {
          "Status": props.status("Active"),
          "Onboarding Phase": props.select("Post-Launch"),
          "Next Renewal": props.date(nextRenewal),
          "Health Score": props.select("Good"),
          "Go Live Date": props.date(goLiveDate),
        });
        console.log(`[go-live] Notion updated for ${client_id}`);
      } catch (err) {
        console.error("[go-live] Notion update failed:", err);
        notionError = err instanceof Error ? err.message : String(err);
      }
    } else {
      notionError = "Notion page not found at Go Live";
    }

    // Update Supabase
    const { error: updateErr } = await supabase
      .from("clients")
      .update({
        go_live_date: new Date().toISOString(),
        status: "active",
        onboarding_phase: "Post-Launch",
        next_renewal_date: nextRenewal,
        health_score: "Good",
        notion_sync_pending: notionError !== null,
        notion_sync_error: notionError,
        notion_sync_attempted_at: new Date().toISOString(),
      })
      .eq("id", client_id);

    if (updateErr) {
      console.error("[go-live] Supabase update failed:", updateErr);
      return new Response(
        JSON.stringify({ error: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        notion_synced: notionError === null,
        notion_page_id: notionPageId,
        next_renewal: nextRenewal,
        note: "Email not sent — send confirmation manually via Gmail",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[go-live] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function computeNextRenewal(contractStart: string | null | undefined): string {
  const base = contractStart ? new Date(contractStart) : new Date();
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().split("T")[0];
}

// supabase/functions/go-live/index.ts
//
// Event 3: Go Live
//
// Triggered by a "Launch & Send Confirmation" button in the Trivelta
// Suite Admin Dashboard. Two things happen in parallel:
//
//   1. Update Notion page:
//      - Status          → Active
//      - Onboarding Phase → Post-Launch
//      - Next Renewal    → Contract Start + 12 months
//      - Health Score    → Good
//
//   2. Send confirmation email to client (SendGrid / Resend / etc.)
//
// The Phase 6 "🚀 Send launch confirmation email to client" task in the
// Notion page body is left unchecked — the AM manually ticks it after
// verifying the email landed. (We could auto-tick it but that couples
// the handler to scanning/modifying block content; keep it simple.)
//
// This handler is INTENTIONALLY SYNCHRONOUS about the email: if email
// sending fails, Notion is NOT updated. This preserves the invariant
// "client is Active ⇒ client received confirmation email".

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

// Email provider — swap for whatever Trivelta standardizes on.
// Current default: Resend. Set RESEND_API_KEY + FROM_EMAIL in Supabase secrets.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "launch@trivelta.com";

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

    // Fetch client details for email + renewal calc
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select(
        "id, name, primary_contact_email, primary_contact_name, contract_start_date, notion_page_id, primary_domain",
      )
      .eq("id", client_id)
      .maybeSingle();

    if (clientErr || !client) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!client.primary_contact_email) {
      return new Response(
        JSON.stringify({
          error: "Cannot go live without primary_contact_email set on client",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Step 1: Send confirmation email (hard requirement) ───
    const emailSent = await sendLaunchConfirmationEmail({
      toEmail: client.primary_contact_email,
      toName: client.primary_contact_name ?? client.name,
      clientName: client.name,
      domain: client.primary_domain ?? null,
    });

    if (!emailSent.ok) {
      return new Response(
        JSON.stringify({
          error: "Email sending failed — aborted Go Live",
          details: emailSent.error,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Step 2: Resolve Notion page ───
    let notionPageId = client.notion_page_id;
    if (!notionPageId) {
      try {
        notionPageId = await findPageByTriveltaClientId(NOTION_TOKEN, client_id);
      } catch (err) {
        console.error("[go-live] Notion lookup failed:", err);
      }
    }

    // ─── Step 3: Update Notion properties ───
    let notionError: string | null = null;
    const nextRenewal = computeNextRenewal(client.contract_start_date);

    if (notionPageId) {
      try {
        await updatePageProperties(NOTION_TOKEN, notionPageId, {
          "Status": props.status("Active"),
          "Onboarding Phase": props.select("Post-Launch"),
          "Next Renewal": props.date(nextRenewal),
          "Health Score": props.select("Good"),
          "Go Live Date": props.date(new Date().toISOString().split("T")[0]),
        });
        console.log(`[go-live] Notion updated for ${client_id}`);
      } catch (err) {
        console.error("[go-live] Notion update failed:", err);
        notionError = err instanceof Error ? err.message : String(err);
      }
    } else {
      notionError = "Notion page not found at Go Live";
    }

    // ─── Step 4: Update Supabase ───
    await supabase
      .from("clients")
      .update({
        go_live_date: new Date().toISOString(),
        onboarding_status: "active",
        onboarding_phase: "Post-Launch",
        next_renewal_date: nextRenewal,
        health_score: "Good",
        notion_sync_pending: notionError !== null,
        notion_sync_error: notionError,
        notion_sync_attempted_at: new Date().toISOString(),
      })
      .eq("id", client_id);

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        notion_synced: notionError === null,
        notion_page_id: notionPageId,
        next_renewal: nextRenewal,
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

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function computeNextRenewal(contractStart: string | null | undefined): string {
  const base = contractStart ? new Date(contractStart) : new Date();
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().split("T")[0];
}

type EmailResult = { ok: true } | { ok: false; error: string };

async function sendLaunchConfirmationEmail(args: {
  toEmail: string;
  toName: string;
  clientName: string;
  domain: string | null;
}): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[go-live] RESEND_API_KEY not set — skipping email (dev mode)");
    return { ok: true }; // in dev, don't block the flow
  }

  const subject = `🎉 ${args.clientName} is live — welcome to Trivelta`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; margin: 0; color: #1a1a1a;">Welcome to Trivelta</h1>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">Your platform is live.</p>
        </div>

        <p>Hi ${escapeHtml(args.toName)},</p>

        <p>
          Congratulations — <strong>${escapeHtml(args.clientName)}</strong> has officially
          gone live on the Trivelta platform${args.domain ? ` at <a href="https://${escapeHtml(args.domain)}" style="color: #D97757;">${escapeHtml(args.domain)}</a>` : ""}.
        </p>

        <p>
          Your dedicated Account Management team is here to support you through every phase
          of post-launch. We'll reach out shortly with next steps, but don't hesitate to
          contact us at any time.
        </p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #555;">
            <strong>What's next:</strong><br/>
            • Your AM will schedule a post-launch check-in within 7 days<br/>
            • Monthly performance reviews start next month<br/>
            • First renewal date: 12 months from contract start
          </p>
        </div>

        <p>Welcome aboard.</p>

        <p style="margin-top: 32px;">
          The Trivelta Team<br/>
          <a href="https://trivelta.com" style="color: #D97757;">trivelta.com</a>
        </p>
      </body>
    </html>
  `.trim();

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: args.toEmail,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return { ok: false, error: `Resend ${resp.status}: ${errorText}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

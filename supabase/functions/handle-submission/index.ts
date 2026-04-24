// Edge Function: handle-submission
// Fires after a client submits their onboarding form.
// Creates a Notion page in the client tracker database with full SOP checklist.

import { createClient } from "npm:@supabase/supabase-js@2";
import { makeCorsHeaders } from "../_shared/cors.ts";

const NOTION_DB_ID = "31aac1484e348067977dda1128916077";
const NOTION_API = "https://api.notion.com/v1/pages";
const NOTION_VER = "2022-06-28";

// ─── Payload shape ────────────────────────────────────────────────────────────

interface ContactBlock {
  name: string;
  email: string;
  phone: string;
}

interface FormData {
  contact_sportsbook: ContactBlock;
  contact_operational: ContactBlock;
  contact_compliance: ContactBlock;
  slack_team_emails: string;
  logo_drive_link: string;
  icon_drive_link: string;
  animation_drive_link: string;
  platform_url: string;
  country: string;
  dns_provider: string;
  dns_access: string;
  color_background: string;
  color_primary: string;
  terms_url: string;
  privacy_url: string;
  rg_url: string;
  footer_required: string;
  landing_page: string;
  landing_page_url: string;
  psp_opay: boolean;
  psp_palmpay: boolean;
  psp_paystack: boolean;
  psp_priority: string;
  kyc_surt: string;
  kyc_notes: string;
  sms_provider: string;
  sms_provider_other: string;
  duns_status: string;
  duns_number: string;
  zendesk: string;
  zendesk_script: string;
  analytics_meta: boolean;
  analytics_ga: boolean;
  analytics_gtm: boolean;
  analytics_snapchat: boolean;
  analytics_reddit: boolean;
}

interface Payload {
  client_id: string;
  client_name: string;
  drive_link: string | null;
  am_name: string | null;
  am_email: string | null;
  sportsbook_name: string;
  sportsbook_email: string;
  platform_url: string;
  country: string;
  psps: string[]; // e.g. ["Opay", "Paystack"]
  form_data: FormData;
}

// ─── Notion block helpers ─────────────────────────────────────────────────────

type RichText = { text: { content: string } }[];

function rt(content: string): RichText {
  return [{ text: { content } }];
}

function heading2(content: string) {
  return { type: "heading_2", heading_2: { rich_text: rt(content) } };
}

function divider() {
  return { type: "divider", divider: {} };
}

function todo(content: string, checked = false) {
  return {
    type: "to_do",
    to_do: { rich_text: rt(content), checked },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slackChannel(clientName: string): string {
  return (
    "#" +
    clientName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-onboarding"
  );
}

function buildNotes(p: Payload): string {
  const f = (p.form_data ?? {}) as Partial<FormData>;
  const analytics =
    (["meta", "ga", "gtm", "snapchat", "reddit"] as const)
      .filter((k) => f?.[`analytics_${k}` as keyof FormData])
      .join(", ") || "-";

  const cs = f.contact_sportsbook ?? { name: "", email: "", phone: "" };
  const co = f.contact_operational ?? { name: "", email: "", phone: "" };
  const cc = f.contact_compliance ?? { name: "", email: "", phone: "" };
  const psps = p.psps ?? [];

  const lines = [
    "TEAM CONTACTS",
    `Sportsbook : ${cs.name ?? "-"}  |  ${cs.email ?? "-"}  |  ${cs.phone ?? "-"}`,
    `Operational: ${co.name ?? "-"}  |  ${co.email ?? "-"}  |  ${co.phone ?? "-"}`,
    `Compliance : ${cc.name ?? "-"}  |  ${cc.email ?? "-"}  |  ${cc.phone ?? "-"}`,
    `Slack invites: ${f.slack_team_emails || "-"}`,
    "",
    "PLATFORM SETUP",
    `URL: ${f.platform_url ?? "-"}  |  Country: ${f.country ?? "-"}`,
    `DNS provider: ${f.dns_provider ?? "-"}  |  DNS access granted: ${f.dns_access ?? "-"}`,
    `Colours - BG: ${f.color_background ?? "-"}  Primary: ${f.color_primary ?? "-"}`,
    "",
    "LEGAL & POLICIES",
    `Footer: ${f.footer_required ?? "-"}  |  Landing page: ${f.landing_page ?? "-"}${f.landing_page_url ? `  (${f.landing_page_url})` : ""}`,
    `Terms: ${f.terms_url ?? "-"}`,
    `Privacy: ${f.privacy_url ?? "-"}`,
    `Responsible Gaming: ${f.rg_url ?? "-"}`,
    "",
    "3RD PARTY",
    `PSPs: ${psps.join(", ") || "-"}  |  Priority: ${f.psp_priority || "-"}`,
    `KYC SURT: ${f.kyc_surt ?? "-"}${f.kyc_notes ? `  (${f.kyc_notes})` : ""}`,
    `SMS: ${f.sms_provider ?? "-"}${f.sms_provider_other ? ` - ${f.sms_provider_other}` : ""}`,
    `DUNS: ${f.duns_status ?? "-"}${f.duns_number ? ` - ${f.duns_number}` : ""}`,
    `Zendesk: ${f.zendesk ?? "-"}`,
    `Analytics: ${analytics}`,
  ];

  return lines.join("\n").slice(0, 2000);
}

// ─── SOP checklist ────────────────────────────────────────────────────────────

function buildSopBlocks(clientName: string): object[] {
  const channel = slackChannel(clientName);

  return [
    // ── Phase 1 ──────────────────────────────────────────────────────────────
    heading2("Phase 1 - Kickoff & AM Setup"),
    todo("Review submitted onboarding form in full"),
    todo("Schedule kickoff call with client (within 24 h)"),
    todo("Create client project folder in Google Drive"),
    todo("Set up internal Asana / Linear project board"),
    todo("Brief technical team on platform scope"),
    divider(),

    // ── Phase 2 ──────────────────────────────────────────────────────────────
    heading2("Phase 2 - Client Comms & Access"),
    todo(`[CLIENT] Complete and submit Onboarding Form`, true), // pre-checked ✓
    todo(`Create Slack channel ${channel} and invite client team`),
    todo("Share Google Drive folder link with client"),
    todo("Send welcome email with timeline and next steps"),
    todo("Confirm DNS access / credentials received"),
    divider(),

    // ── Phase 3 ──────────────────────────────────────────────────────────────
    heading2("Phase 3 - Platform Configuration"),
    todo("Configure domain and DNS records"),
    todo("Upload and apply logo, icon and animation assets"),
    todo("Implement brand colour system across all components"),
    todo("Integrate and test PSP(s)"),
    todo("Configure KYC / SURT integration"),
    todo("Set up SMS provider"),
    todo("Implement Zendesk widget (if required)"),
    todo("Implement analytics tags (Meta, GA, GTM, etc.)"),
    divider(),

    // ── Phase 4 ──────────────────────────────────────────────────────────────
    heading2("Phase 4 - Content & Legal"),
    todo("Build landing page (if required)"),
    todo("Configure footer with required legal links"),
    todo("Verify Terms & Conditions URL is live and correct"),
    todo("Verify Privacy Policy URL is live and correct"),
    todo("Verify Responsible Gaming URL is live and correct"),
    todo("Validate DUNS number or assist with application"),
    divider(),

    // ── Phase 5 ──────────────────────────────────────────────────────────────
    heading2("Phase 5 - QA & Testing"),
    todo("Complete internal QA pass (desktop + mobile)"),
    todo("Test full payment deposit / withdrawal flow"),
    todo("Test KYC registration and verification flow"),
    todo("Verify all policy links in footer resolve correctly"),
    todo("Send staging URL to client for review"),
    todo("Collect client feedback and implement revisions"),
    todo("Obtain written sign-off from client"),
    divider(),

    // ── Phase 6 ──────────────────────────────────────────────────────────────
    heading2("Phase 6 - Launch"),
    todo("Final pre-launch checklist sign-off"),
    todo("Perform DNS cutover to production"),
    todo("Deploy to production environment"),
    todo("Smoke-test live production site"),
    todo("Monitor platform for 24 h post-launch"),
    todo("Send launch confirmation email to client"),
    todo("Hand over to ongoing account management"),
  ];
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();
    const {
      client_id,
      client_name,
      drive_link,
      sportsbook_name,
      sportsbook_email,
      platform_url,
      country,
      psps,
    } = payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Build AM email → Notion user ID map dynamically from role_assignments table,
    // then look up which AMs are assigned to this client.
    const [{ data: raRows }, { data: camRows }] = await Promise.all([
      supabase
        .from("role_assignments")
        .select("email, notion_user_id")
        .eq("role", "account_manager"),
      supabase.from("client_account_managers").select("am_email").eq("client_id", client_id),
    ]);

    // Cache for this invocation: email → notion_user_id
    const notionIdByEmail: Record<string, string> = {};
    for (const row of raRows ?? []) {
      if (row.email && row.notion_user_id) {
        notionIdByEmail[row.email] = row.notion_user_id;
      }
    }

    const am_notion_ids: string[] = (camRows ?? [])
      .map((r: { am_email: string | null }) => r.am_email && notionIdByEmail[r.am_email])
      .filter(Boolean) as string[];

    // ── Properties ───────────────────────────────────────────────────────────

    const properties: Record<string, unknown> = {
      "Client Name": { title: rt(client_name) },
      Status: { status: { name: "Onboarding" } },
      "Primary Contact": { rich_text: rt(sportsbook_name || "") },
      "Contact Email": { email: sportsbook_email || null },
      Website: { url: platform_url || null },
      Notes: { rich_text: rt(buildNotes(payload)) },
    };

    if (country) {
      properties["Country"] = { select: { name: country } };
    }

    if (drive_link) {
      properties["Drive"] = { url: drive_link };
    }

    if (psps && psps.length > 0) {
      properties["PSPs"] = { multi_select: psps.map((name) => ({ name })) };
    }

    if (am_notion_ids && am_notion_ids.length > 0) {
      properties["Account Manager"] = {
        people: am_notion_ids.map((id) => ({ object: "user", id })),
      };
    }

    // ── Children blocks ───────────────────────────────────────────────────────

    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const children = [
      {
        type: "callout",
        callout: {
          rich_text: rt(`✅ Submitted via Trivelta Onboarding Hub on ${date}`),
          icon: { emoji: "✅" },
          color: "green_background",
        },
      },
      divider(),
      ...buildSopBlocks(client_name),
    ];

    // ── POST to Notion (non-fatal) ────────────────────────────────────────────

    const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
    let notionSynced = false;
    let notionPageId: string | null = null;

    try {
      if (!NOTION_TOKEN) {
        throw new Error("NOTION_TOKEN environment variable is not set");
      }

      const res = await fetch(NOTION_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VER,
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties,
          children,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Notion API ${res.status}: ${body}`);
      }

      const page = await res.json();
      notionPageId = page.id;
      notionSynced = true;
      console.log("[handle-submission] Notion page created", page.id, "for client", client_name);
    } catch (notionErr) {
      // Network error, timeout, DNS failure, bad token, API error — Notion unreachable.
      // This is non-fatal: the client's form submission must still succeed.
      const errMsg = notionErr instanceof Error ? notionErr.message : String(notionErr);
      console.error("[handle-submission] Notion sync failed (non-fatal):", errMsg);

      // Record failure in DB so admins can see it and retry later.
      await supabase
        .from("onboarding_forms")
        .update({
          notion_sync_pending: true,
          notion_sync_error: errMsg,
          notion_sync_attempted_at: new Date().toISOString(),
        })
        .eq("client_id", client_id);
    }

    // Return success to client regardless of Notion status.
    return new Response(
      JSON.stringify({ success: true, notion_synced: notionSynced, notion_page_id: notionPageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[handle-submission] Error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
